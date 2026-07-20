# Forge

A lightweight project/task tracker full-stack project — Workspace → Project → Task, with
per-user ownership enforced at every layer.

[![CI](https://github.com/Atmospheres/Forge/actions/workflows/ci.yml/badge.svg)](https://github.com/Atmospheres/Forge/actions/workflows/ci.yml)
[![E2E](https://github.com/Atmospheres/Forge/actions/workflows/e2e.yml/badge.svg)](https://github.com/Atmospheres/Forge/actions/workflows/e2e.yml)

- **frontend/** — React 18 + TypeScript + Vite, TanStack Router + TanStack Query, Auth0 (OIDC/PKCE), Tailwind CSS (with dark mode, synced server-side per account)
- **backend/** — Spring Boot 4 (Java 21), Spring Security OAuth2 Resource Server, Spring Data JPA + Hibernate, Postgres, Flyway
- **frontend/e2e/** — Playwright tests against the real stack (real Auth0 login, real backend, an isolated database) — see `frontend/e2e/README.md`
- **docker-compose.yml** — local Postgres instance
- **.github/workflows/ci.yml** — backend (tests, checkstyle, spotbugs, OWASP dependency scan) and frontend (lint, tests, build) on every push/PR to `main`
- **.github/workflows/e2e.yml** — the Playwright suite above, against a Postgres service container and a real backend started in-job; nightly + on-demand, not on every push

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

Uses the NVD API, which is rate-limited hard without a key (5 req/30s vs 50 req/30s).

**CI**: already configured — the `NVD_API_KEY` repository secret is set (Settings > Secrets
and variables > Actions), and the downloaded CVE data is cached between runs (see
`.github/workflows/ci.yml`), so only the first run after a cache miss pays the full sync cost.

**Local dev**: request your own free key at https://nvd.nist.gov/developers/request-an-api-key,
then export it before running the scan:

```
export NVD_API_KEY=your-key
./mvnw org.owasp:dependency-check-maven:check
```

Without it the scan still works, just slower (and only ever hits the unauthenticated rate
limit locally — there's no local cache like CI has).

## E2E tests

Playwright, but against the real stack, not mocks: a real Auth0 login, the real backend, and
an isolated Postgres database so runs don't touch your normal dev data.

**CI**: runs nightly (06:00 UTC) via `.github/workflows/e2e.yml`, plus on-demand from the
Actions tab (`workflow_dispatch`). Deliberately not on every push — Auth0's hosted login page
in a headless browser is slower and more failure-prone than anything in the unit-test suite,
and a transient Auth0-side hiccup shouldn't block an unrelated PR. Postgres runs as a GitHub
Actions service container; the backend is built and started in the same job. Needs five
repository secrets: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` (shared with the backend's own env vars),
`VITE_AUTH0_CLIENT_ID`, and the dedicated test user's `E2E_AUTH0_EMAIL` / `E2E_AUTH0_PASSWORD`.
On failure, the Playwright HTML report and backend log are uploaded as build artifacts.

**Local dev**: needs a one-time setup — a dedicated Auth0 test user and its credentials in a
gitignored `frontend/.env.e2e` — see `frontend/e2e/README.md` for the full walkthrough. Then:

```
docker compose -f docker-compose.e2e.yml up -d postgres-e2e
cd backend && SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/forge_e2e ./mvnw spring-boot:run
cd frontend && npm run test:e2e
```

(The local Postgres runs on 5433, `tmpfs`-backed so it never persists — CI's service container
is a separate, equally disposable instance on 5432, only alive for that one job.)

## Status

Implemented: full CRUD for Workspace/Project/Task with ownership checks at every layer,
Auth0 login flow, TanStack Router nested routes with a drag-and-drop task board, optimistic
mutations, dark mode (synced per-account, not just localStorage), backend JUnit tests
(`@WebMvcTest` + Mockito), frontend Vitest + RTL tests, a real-stack Playwright E2E suite, CI.
