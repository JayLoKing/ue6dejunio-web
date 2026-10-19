# Deploy the web image

Build this repository independently with `docker build --build-arg VITE_API_URL=https://school.example/api -t ue6-web:local .`.
The URL is public, absolute, and compiled into the bundle; changing it requires rebuilding.
Never supply tokens, passwords or private keys as build arguments.

## Runtime

The image runs Nginx as UID 101 on port 8080. Set `API_UPSTREAM` to the API's
internal DNS name and port (for example `api:8090`); never a browser-facing URL.
Nginx proxies `/api/` without stripping the prefix, disables buffering for SSE,
and falls back to `index.html` for TanStack browser routes.
Only attach trusted services to the shared backend network.

In Dokploy create an Application from THIS repository and select its Dockerfile.
Provide VITE_API_URL as a build argument and API_UPSTREAM as a runtime variable.
Give this service the public HTTPS domain through Dokploy Domains, targeting 8080.
The API must be reachable from this container over a private shared network; its
service DNS name is assigned in Dokploy, not assumed to equal a local Compose alias.
No sibling checkouts are required. See the API repository's deployment guide for
DB initialization, secrets, prediction artifacts and verification.

## Verification

Check `/healthz`, a direct browser deep-link, login, API errors, and a notification
stream that remains connected. A static healthcheck does not prove API readiness.
On 2026-10-19, the image built successfully and an isolated four-service Compose
stack reached healthy status. Static health, a reset-password deep-link and login
through the web proxy passed. Full suites, browser E2E, notification-stream and SMTP
checks were not rerun; production deployment has not been validated.
