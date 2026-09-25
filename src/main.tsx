import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { RouterProvider, createRouter } from "@tanstack/react-router"

import "./index.css"
import "@/config/env"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/queryClient"
import { ErrorFallback } from "@/components/shared/ErrorFallback"
import { routeTree } from "./routeTree.gen"

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultErrorComponent: ({ error, reset }) => (
    <ErrorFallback error={error} reset={reset} />
  ),
  defaultNotFoundComponent: () => (
    <div className="flex min-h-svh items-center justify-center text-muted-foreground">
      404 — Recurso no encontrado.
    </div>
  ),
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          {/* Sin `richColors`: pintaba el aviso entero del color del tipo, con los verdes y rojos
              de sonner y no los de esta paleta, y con el texto perdiendo contraste justo cuando
              algo salía mal. El tipo ahora se dice con la barra y el ícono — ver `.cn-toast`. */}
          <Toaster position="top-right" />
        </TooltipProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
