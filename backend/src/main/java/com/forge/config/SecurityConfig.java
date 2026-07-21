package com.forge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configures this API as an OAuth2 Resource Server that validates JWTs
 * issued by Auth0.
 *
 * Two things are checked on every incoming token:
 *  1. Standard claims (issuer, expiry, signature) — handled by Spring's
 *     default validators, wired against Auth0's issuer/JWKS endpoint.
 *  2. Audience — Auth0 access tokens only include your API's audience if
 *     the frontend requested it explicitly when logging in, so this is
 *     verified separately.
 */
@Configuration
public class SecurityConfig {

    @Value("${forge.auth0.audience}")
    private String audience;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuer;

    @Value("${forge.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public RateLimitFilter rateLimitFilter(
        @Value("${forge.rate-limit.capacity:120}") int capacity,
        @Value("${forge.rate-limit.refill-tokens:120}") int refillTokens,
        @Value("${forge.rate-limit.refill-period-seconds:60}") int refillPeriodSeconds
    ) {
        return new RateLimitFilter(capacity, refillTokens, refillPeriodSeconds);
    }

    // Spring Boot auto-registers any Filter bean directly with the embedded servlet
    // container by default. Disabled here since rateLimitFilter is deliberately wired
    // into the Spring Security chain below instead (via addFilterAfter) -- without this
    // it would run twice per request, once outside Spring Security's context where the
    // JWT subject isn't available yet.
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter rateLimitFilter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(rateLimitFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, RateLimitFilter rateLimitFilter) throws Exception {
        http
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable()) // stateless JWT API, no cookies/CSRF surface
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                    "/actuator/health",
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/v3/api-docs.yaml",
                    "/webjars/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            // Runs after the bearer token is parsed so authenticated requests are
            // keyed by JWT subject rather than IP; unauthenticated requests still
            // fall back to per-IP limiting.
            .addFilterAfter(rateLimitFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = (NimbusJwtDecoder) JwtDecoders.fromOidcIssuerLocation(issuer);

        OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withAudience =
            new AudienceValidator(audience);
        OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withIssuer =
            JwtValidators.createDefaultWithIssuer(issuer);

        jwtDecoder.setJwtValidator(new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
            withIssuer, withAudience
        ));

        return jwtDecoder;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
            Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList()
        );
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
