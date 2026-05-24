import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_app/reports")({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <p className="text-muted-foreground">
        Reportes cargados perezosamente.
      </p>
    </div>
  )
}
