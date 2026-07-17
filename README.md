# Forge

A lightweight project/task tracker full-stack project — Workspace → Project → Task, with
per-user ownership enforced at every layer.

[![CI](https://github.com/Atmospheres/Forge/actions/workflows/ci.yml/badge.svg)](https://github.com/Atmospheres/Forge/actions/workflows/ci.yml)

- **frontend/** — React 18 + TypeScript + Vite, TanStack Router + TanStack Query, Auth0 (OIDC/PKCE), Tailwind CSS
- **backend/** — Spring Boot 4 (Java 21), Spring Security OAuth2 Resource Server, Spring Data JPA + Hibernate, Postgres, Flyway
- **docker-compose.yml** — local Postgres instance
- **.github/workflows/ci.yml** — backend (tests, checkstyle, spotbugs, OWASP dependency scan) and frontend (lint, tests, build) on every push/PR to `main`

## Getting started

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`, filling in the Auth0 values.
2. `docker compose up -d` to start Postgres.
3. `cd backend && ./mvnw spring-boot:run`
4. `cd frontend && npm install && npm run dev`

## Running checks locally

These mirror what CI runs on every push:

```
# backend
cd backend
./mvnw test              # JUnit
./mvnw checkstyle:check
./mvnw spotbugs:check
./mvnw org.owasp:dependency-check-maven:check   # slow on a cold cache; see below

# frontend
cd frontend
npm run lint              # generates the route tree first (prelint hook)
npm test -- --run         # vitest
npm run build              # vite build, then tsc -b
```

### OWASP dependency-check

Uses the NVD API, which is rate-limited hard without a key (5 req/30s vs 50 req/30s). For a
faster local scan, request a free key at https://nvd.nist.gov/developers/request-an-api-key
and export it before running:

```
export NVD_API_KEY=your-key
```

In CI this is read from the `NVD_API_KEY` repository secret and the downloaded CVE data is
cached between runs (see `.github/workflows/ci.yml`), so only the first run after a cache
miss pays the full sync cost.

## Status

Implemented: full CRUD for Workspace/Project/Task with ownership checks at every layer,
Auth0 login flow, TanStack Router nested routes with a drag-and-drop task board, optimistic
mutations, backend JUnit tests (`@WebMvcTest` + Mockito) and frontend Vitest + RTL tests, CI.

Not yet: end-to-end tests (`npm run test:e2e` is wired to Playwright but there are no specs
yet).
