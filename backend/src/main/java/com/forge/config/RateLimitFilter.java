package com.forge.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * In-memory token-bucket rate limiter, keyed per authenticated user (JWT
 * subject) or, for requests with no valid token, per client IP.
 *
 * In-memory because this runs as a single instance; a multi-instance
 * deployment would need a shared store (e.g. Redis) instead.
 *
 * Deliberately not a @Component: it's wired into the Spring Security filter
 * chain explicitly via addFilterAfter in SecurityConfig. A component-scanned
 * Filter bean would also get auto-registered as a bare servlet filter by
 * Spring Boot, running it a second time outside Spring Security's context.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    // Mirrors SecurityConfig's permitAll list -- these aren't API traffic
    // an abusive client would target, and infra health probes shouldn't be
    // able to trip a limit meant for that.
    private static final List<String> EXEMPT_PATH_PREFIXES = List.of(
        "/actuator/health", "/swagger-ui", "/v3/api-docs", "/webjars"
    );

    private final Cache<String, Bucket> buckets;
    private final int capacity;
    private final int refillTokens;
    private final Duration refillPeriod;

    public RateLimitFilter(
        @Value("${forge.rate-limit.capacity:120}") int capacity,
        @Value("${forge.rate-limit.refill-tokens:120}") int refillTokens,
        @Value("${forge.rate-limit.refill-period-seconds:60}") int refillPeriodSeconds
    ) {
        this.capacity = capacity;
        this.refillTokens = refillTokens;
        this.refillPeriod = Duration.ofSeconds(refillPeriodSeconds);
        this.buckets = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXEMPT_PATH_PREFIXES.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, HttpServletResponse response, FilterChain filterChain
    ) throws ServletException, IOException {
        Bucket bucket = buckets.get(keyFor(request), key -> newBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(refillPeriod.toSeconds()));
        response.getWriter().write("{\"error\":\"Rate limit exceeded, try again later.\"}");
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
            .capacity(capacity)
            .refillGreedy(refillTokens, refillPeriod)
            .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String keyFor(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return "user:" + jwt.getSubject();
        }
        return "ip:" + request.getRemoteAddr();
    }
}
