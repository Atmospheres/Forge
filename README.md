# Forge

A lightweight project/task tracker full-stack project.

- **frontend/** — React 18 + TypeScript + Vite, TanStack Router + TanStack Query, Auth0 (OIDC/PKCE), Tailwind + shadcn/ui
- **backend/** — Spring Boot 3 (Java 21), Spring Security OAuth2 Resource Server, Spring Data JPA + Hibernate, Postgres, Flyway
- **docker-compose.yml** — local Postgres instance

## Getting started

1. Create an Auth0 application (SPA) and a separate Auth0 API (resource server). Note the domain, client ID, and API audience.
2. Copy `backend/.env.example` to `backend/.env` (or set as real env vars) and fill in your Auth0 domain + audience.
3. Copy `frontend/.env.example` to `frontend/.env` and fill in your Auth0 domain, client ID, and audience.
4. `docker compose up -d` to start Postgres.
5. `cd backend && ./mvnw spring-boot:run`
6. `cd frontend && npm install && npm run dev`

## Build order (suggested)

1. Backend skeleton + health check endpoint, unprotected.
2. Wire Auth0 as an OAuth2 resource server, protect the health check, confirm a JWT from the frontend validates.
3. JPA entities (Workspace, Project, Task) + Flyway migration.
4. REST controllers + DTOs + springdoc-openapi.
5. Frontend Auth0 login flow (Auth0Provider + protected routes).
6. Generate TS types from the OpenAPI spec (`openapi-typescript`).
7. TanStack Query client wired to an auth-aware fetcher.
8. TanStack Router nested routes: workspace → project → task board.
9. Mutations + optimistic updates for task create/reorder.
10. Testing: JUnit + Spring Boot Test (backend), Vitest + RTL + Playwright (frontend).
