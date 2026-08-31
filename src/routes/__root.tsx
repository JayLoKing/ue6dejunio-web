import { QueryClient } from "@tanstack/react-query"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"

import { ErrorFallback } from "@/components/shared/ErrorFallback"

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <ErrorFallback error={error} reset={reset} />
  ),
  notFoundComponent: () => (
    <div className="flex min-h-svh items-center justify-center text-muted-foreground">
      404 — Recurso no encontrado.
    </div>
  ),
})

function RootComponent() {
  return <Outlet />
}
