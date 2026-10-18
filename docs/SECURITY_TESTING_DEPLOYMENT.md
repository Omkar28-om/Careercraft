# Security, tests, and deployment

## Local setup

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and a unique `JWT_SECRET` (at least 32 characters).
2. Run `npm run db:migrate` in `server/` to apply the numbered SQL migrations. Applied migrations are recorded in `schema_migrations` and are not run again.
3. From the project root, run `npm run dev` to start the API and client together. Keep that terminal open while using the site.
4. Open the Vite URL printed in the client terminal (configured port: `http://localhost:5177`).

## Admin access

Create a normal account through the app, then promote that existing account from `server/`:

```sh
npm run admin:promote -- student@example.com
```

The command changes only the specified existing account’s role. Admin API endpoints also verify the current role and account status in PostgreSQL for each request. Do not expose the database or this script as a public endpoint.

## Automated checks

From the project root, `npm test` runs the server security tests and checks that static navigation destinations match declared React Router routes. Run `npm run build` for a production frontend build. The security tests cover exact production origin matching, unsafe cross-origin request rejection, and startup configuration checks. Admin and student browser flows still need verification against a reachable PostgreSQL database.

## Render deployment

`render.yaml` defines a Node API, PostgreSQL database, and React static site. Connect the repository to Render and create a Blueprint deployment. In the generated service settings, set:

- API `CLIENT_URL`: the deployed static-site HTTPS URL.
- API `CORS_ORIGINS`: optional comma-separated additional HTTPS frontend origins.
- Client `VITE_API_URL`: `https://<the-api-service-host>/api`.

Render generates `JWT_SECRET`; keep it private and do not rotate it casually because existing sessions will stop working. The API runs numbered migrations as a pre-deploy step. The database must be reachable before the first deploy. After deployment, verify `/api/health`, registration/login, course loading/enrollment/lesson progress, and admin access with both a student and an admin account. The project does not publish itself; a Render account and repository connection are required to deploy.

## Security notes

- Production CORS uses exact configured HTTPS origins. State-changing browser requests with an untrusted `Origin` are rejected.
- JWTs remain in HTTP-only cookies; passwords are bcrypt-hashed and registration constrains bcrypt input to avoid silent 72-byte truncation.
- Keep `DATABASE_URL`, `JWT_SECRET`, and any optional code-execution provider key in the hosting provider’s secret settings. Never commit `.env` files.
- The built-in request limiter is in-memory per server process. For multiple API instances, use a shared store or an upstream gateway limit.
