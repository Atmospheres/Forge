package com.forge.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsRequestsWithinCapacity() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(2, 2, 60);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/workspaces");
        request.setRemoteAddr("127.0.0.1");
        AtomicInteger chainCalls = new AtomicInteger();

        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> chainCalls.incrementAndGet());
        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> chainCalls.incrementAndGet());

        assertEquals(2, chainCalls.get());
    }

    @Test
    void blocksRequestsOverCapacityWith429AndRetryAfter() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1, 1, 60);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/workspaces");
        request.setRemoteAddr("127.0.0.1");
        AtomicInteger chainCalls = new AtomicInteger();

        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> chainCalls.incrementAndGet());
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request, blocked, (req, res) -> chainCalls.incrementAndGet());

        assertEquals(1, chainCalls.get());
        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
        assertTrue(blocked.getContentAsString().contains("Rate limit exceeded"));
    }

    @Test
    void differentAuthenticatedUsersGetIndependentBuckets() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1, 1, 60);
        AtomicInteger chainCalls = new AtomicInteger();

        SecurityContextHolder.getContext().setAuthentication(
            new TestingAuthenticationToken(jwtWithSubject("auth0|user-a"), null));
        filter.doFilter(
            new MockHttpServletRequest("GET", "/api/workspaces"),
            new MockHttpServletResponse(),
            (req, res) -> chainCalls.incrementAndGet());

        SecurityContextHolder.getContext().setAuthentication(
            new TestingAuthenticationToken(jwtWithSubject("auth0|user-b"), null));
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(
            new MockHttpServletRequest("GET", "/api/workspaces"),
            response,
            (req, res) -> chainCalls.incrementAndGet());

        assertEquals(2, chainCalls.get());
        assertEquals(200, response.getStatus());
    }

    @Test
    void unauthenticatedRequestsAreKeyedByIpNotSharedGlobally() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1, 1, 60);
        AtomicInteger chainCalls = new AtomicInteger();

        MockHttpServletRequest requestFromIpA = new MockHttpServletRequest("GET", "/api/workspaces");
        requestFromIpA.setRemoteAddr("10.0.0.1");
        MockHttpServletRequest requestFromIpB = new MockHttpServletRequest("GET", "/api/workspaces");
        requestFromIpB.setRemoteAddr("10.0.0.2");

        filter.doFilter(requestFromIpA, new MockHttpServletResponse(), (req, res) -> chainCalls.incrementAndGet());
        filter.doFilter(requestFromIpB, new MockHttpServletResponse(), (req, res) -> chainCalls.incrementAndGet());

        assertEquals(2, chainCalls.get());
    }

    @Test
    void exemptsHealthAndDocsPathsFromRateLimiting() {
        RateLimitFilter filter = new RateLimitFilter(1, 1, 60);

        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/actuator/health")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/swagger-ui/index.html")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/v3/api-docs")));
        assertTrue(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/webjars/foo.js")));
        assertFalse(filter.shouldNotFilter(new MockHttpServletRequest("GET", "/api/workspaces")));
    }

    private Jwt jwtWithSubject(String subject) {
        return Jwt.withTokenValue("token")
            .header("alg", "none")
            .subject(subject)
            .claim("sub", subject)
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(60))
            .build();
    }
}
