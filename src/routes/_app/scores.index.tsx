import { createFileRoute } from "@tanstack/react-router"
import { ClipboardListIcon } from "lucide-react"

export const Route = createFileRoute("/_app/scores/")({
  component: ScoresIndex,
})

function ScoresIndex() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-12 text-center text-muted-foreground">
      <ClipboardListIcon className="size-8" />
      <p>
        Selecciona una materia o curso en el menú lateral para registrar notas.
      </p>
    </div>
  )
}
