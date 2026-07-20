# E2E tests

Runs against the real backend, real Postgres, and a real Auth0 login (not
mocks) — so they need a bit of one-time setup that unit tests don't.

## One-time setup

1. **Dedicated Auth0 test user.** In the Auth0 dashboard: User Management >
   Users > Create User, using the Username-Password-Authentication
   connection (not a social login — Playwright drives the actual login
   form). Use an account that exists *only* for this, not a real login.

2. **Isolated E2E database**, so test runs never touch your normal dev data:

   ```
   docker compose -f ../docker-compose.e2e.yml up -d postgres-e2e
   ```

3. **Backend, pointed at the E2E database** (not the one from the main
   `README.md`'s Getting Started — that's your normal dev DB on 5432, this
   is a separate one on 5433):

   ```
   cd backend
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/forge_e2e ./mvnw spring-boot:run
   ```

4. **Credentials for the test user**, as environment variables (never commit
   these — put them in `frontend/.env.e2e`, which is gitignored):

   ```
   E2E_AUTH0_EMAIL=your-test-user@example.com
   E2E_AUTH0_PASSWORD=...
   ```

## Running

```
cd frontend
npm run test:e2e
```

This starts the Vite dev server automatically (see `playwright.config.ts`),
logs in once via the real Auth0 flow and reuses that session across the
whole run (`e2e/global.setup.ts`), then runs the specs.

## Notes

- Tests run serially against one shared Auth0 account and one shared
  database — that's why `playwright.config.ts` sets `workers: 1` and
  `fullyParallel: false`. Parallelizing would mean two tests racing to
  create/rename/delete the same workspaces.
- `docker-compose.e2e.yml`'s Postgres uses `tmpfs`, not a persisted volume,
  so it starts empty every time it's (re)started -- no manual cleanup
  between runs.
