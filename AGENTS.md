# Code Review Rules — ue6dejunio-web

Frontend: React 19 + TypeScript + TanStack Router + Vite 7 + Bun + shadcn/ui + Tailwind v4 + zustand + react-query + react-hook-form + zod. Consumes a Spring Boot API at `/api`.

## Architecture (Screaming / feature-based)
- Code lives under `src/features/<feature>/` with `types/`, `helpers/`, `services/`, `hooks/`, `components/`.
- Strict data layer, one direction only:
  - **helpers** make raw API calls, return `UseApiCall<T>` using `loadAbort()` + `httpClient`, with query params in the axios config (`params`). No business logic.
  - **services** consume `helper.xAsync().call` and return `.data`. No React.
  - **hooks** (react-query) consume services. Query keys are arrays; invalidate by key prefix.
  - **components** consume hooks. No direct axios/service calls from components.
- Do not skip layers (e.g. component calling a helper directly).

## TypeScript
- Use `const`/`let`, never `var`. No `any` (prefer `unknown` + narrowing).
- Prefer `interface` for object shapes; `type` for unions/aliases.
- Explicit return types on exported services/helpers/hooks. React components may omit the return type (JSX inferred).
- Backend nullable fields are `T | null` in types, not optional, when the API always sends the key.

## React / hooks
- Functional components only. Named exports for components.
- Stabilize react-query `data ?? []` with `useMemo` before feeding it into dependent `useMemo`/`useEffect` chains (avoids infinite render loops).
- No new object/array literals as props/deps without memoization when they drive effects.
- Effects must have correct, minimal dependency arrays; no `setState` loops.

## Routing (TanStack file-based)
- A route file with children must render `<Outlet />`; put the page itself in an `index` route and keep the parent as a layout.
- Regenerate `src/routeTree.gen.ts` via `bun run build` — never hand-edit it. It is excluded from review.

## Styling
- Tailwind v4 utility classes + shadcn/ui primitives. Use the `cn()` helper for conditional classes. No inline style objects unless dynamic.

## Language of artifacts
- Code identifiers and commit messages: English.
- Comments: follow the surrounding code; neutral/professional Spanish is the established convention in this repo and is acceptable.
- User-facing UI copy: neutral/professional Spanish, correctly accented (á, é, í, ó, ú, ñ).

## Testing
- Vitest + Testing Library. Query by role/accessible name, use `userEvent`. Test files `*.{test,spec}.{ts,tsx}`.

## Quality gates (must stay green)
- `bunx tsc -b` and `bun run build` must pass.
- No unused imports/vars. No `console.log` left in committed code.
- Conventional Commits. No AI attribution / Co-Authored-By trailers.
