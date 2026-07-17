# Forge — Spring Boot 4 Migration: Current Blocker

## Project context

Forge is a full-stack project/task tracker (Linear/Trello-lite), used as a skills-refresh
project. Stack: Vite + TS + React 18 + TanStack Router/Query + Auth0 on the frontend;
Spring Boot + Spring Security OAuth2 Resource Server + Spring Data JPA + Flyway + Postgres
on the backend. Backend lives at `backend/`, frontend at `frontend/`.

## What's been done

- Full CRUD (create/read/update/delete) for Workspace → Project → Task, with ownership
  enforcement at every layer (a user can only touch their own workspaces/projects/tasks).
- A `GlobalExceptionHandler` (`@RestControllerAdvice`) mapping `NoSuchElementException` to
  a proper `404`.
- JUnit tests (`@WebMvcTest` + Mockito `@MockBean`/now `@MockitoBean`) covering ownership
  checks, validation, and the exception handler, across four test classes:
  `WorkspaceControllerTest`, `ProjectControllerTest`, `TaskControllerTest`,
  `GlobalExceptionHandlerTest`.
- **Today's task**: migrated the backend from Spring Boot 3.3.2 → **4.0.1**, motivated by an
  OWASP dependency-check scan flagging CVEs in the old (now fully EOL) 3.3 line.

## Migration steps already completed successfully

1. Bumped `spring-boot-starter-parent` to `4.0.1` in `pom.xml`. Main source code (`src/main`)
   compiles clean with **zero changes needed** — only test code was affected.
2. Replaced `@MockBean` (removed in Boot 4) with `@MockitoBean`
   (`org.springframework.test.context.bean.override.mockito.MockitoBean`) in all four test
   files.
3. Added two new test-scoped dependencies to `pom.xml` (Boot 4 modularized `@WebMvcTest` out
   of `spring-boot-starter-test` into separate artifacts):
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-webmvc-test</artifactId>
       <scope>test</scope>
   </dependency>
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-webmvc-test</artifactId>
       <scope>test</scope>
   </dependency>
   ```
4. Updated the `@WebMvcTest` import path (package moved in Boot 4):
   ```java
   import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
   ```
5. Added `excludeAutoConfiguration = OAuth2ResourceServerAutoConfiguration.class` to each
   `@WebMvcTest(...)` annotation, since Boot 4's `OAuth2ResourceServerAutoConfiguration` now
   tries to build a real `SecurityFilterChain` inside the narrow `@WebMvcTest` slice (it
   didn't in Boot 3), which fails because that slice has no `HttpSecurity` bean. Import:
   ```java
   import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
   ```
6. Swapped `ObjectMapper` for `JsonMapper` in the three test files that build JSON request
   bodies (`WorkspaceControllerTest`, `ProjectControllerTest`, `TaskControllerTest`), since
   Boot 4 defaults to Jackson 3, which no longer auto-configures an `ObjectMapper` bean:
   ```java
   import tools.jackson.databind.json.JsonMapper; // NOT com.fasterxml.jackson...

   @Autowired
   private JsonMapper jsonMapper; // was: ObjectMapper objectMapper
   ```
   All `objectMapper.writeValueAsString(...)` calls became `jsonMapper.writeValueAsString(...)`.

## Current blocker — UNRESOLVED

**Symptom**: Every single `@WebMvcTest` in all four test classes fails identically with:
```
jakarta.servlet.ServletException: Request processing failed:
org.springframework.beans.BeanInstantiationException: Failed to instantiate
[org.springframework.security.oauth2.jwt.Jwt]: Constructor threw exception
Caused by: java.lang.IllegalArgumentException: tokenValue cannot be empty
```

**Fix attempted**: explicitly set a token value in every `SecurityMockMvcRequestPostProcessors
.jwt()` call, e.g.:
```java
.with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
```
and for calls with no customizer:
```java
.with(jwt().jwt(j -> j.tokenValue("test-token")))
```

**This fix has been verified present** via:
- A project-wide search for bare `.with(jwt())` (no customizer) → **0 results**.
- Manual inspection of multiple individual test methods across multiple files, all
  confirmed to have `.tokenValue("test-token")` set correctly, with balanced parentheses.
- A full `Remove-Item -Recurse -Force target` + fresh `.\mvnw.cmd test` run (ruling out
  stale compiled classes / Maven caching).

**Despite all of the above, the exact same `tokenValue cannot be empty` error persists on
every test**, including ones with the fix confirmed correctly in place.

## What this suggests

Since the fix is verified present in source and a clean rebuild didn't change the outcome,
this may indicate:
- A genuine behavior change/regression in Spring Security 7's `JwtRequestPostProcessor` where
  `.tokenValue(...)` on the builder isn't being honored in this specific Boot 4.0.1 /
  Spring Security 7 combination (unconfirmed — official 7.0.0 API docs describe the expected
  behavior as working normally).
- Something environment-specific (a second stale copy of a class, a classpath conflict
  between two versions of spring-security-test, an IDE/build tool disagreement about what's
  actually being compiled) that hasn't been identified yet.

## Suggested next diagnostic steps

1. Add a temporary `System.out.println` or breakpoint immediately before the failing
   `mockMvc.perform(...)` call to directly inspect the `Jwt.Builder` state before it's used,
   confirming whether `tokenValue` is actually being applied at runtime.
2. Check `mvn dependency:tree` for any duplicate/conflicting versions of
   `spring-security-test` or `spring-security-oauth2-jose` that might indicate two different
   `Jwt`/`Jwt.Builder` classes are in play.
3. As a workaround, try constructing a `Jwt` object manually and passing it directly to
   `jwt(Jwt)` (the overload that takes a pre-built `Jwt`) instead of using the builder
   `Consumer` form, to see if that sidesteps whatever's happening with the builder path:
   ```java
   Jwt testJwt = Jwt.withTokenValue("test-token")
       .header("alg", "none")
       .subject(OWNER_SUB)
       .build();
   // then: .with(jwt(testJwt))
   ```

## Environment

- Windows 10/11, PowerShell, VS Code
- Java 21 (Eclipse Temurin)
- Maven (via `mvnw.cmd`)
- Spring Boot 4.0.1, Spring Security (version managed by Boot 4.0.1's BOM)
