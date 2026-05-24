import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_app/attendance")({
  component: AttendancePage,
})

function AttendancePage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Cuaderno de asistencias</h1>
      <p className="text-muted-foreground">
        Modulo cargado bajo demanda (lazy chunk).
      </p>
    </div>
  )
}
