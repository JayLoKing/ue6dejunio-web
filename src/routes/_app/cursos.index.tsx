import { createFileRoute } from "@tanstack/react-router"
import { BookOpenIcon } from "lucide-react"

export const Route = createFileRoute("/_app/cursos/")({
  component: () => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-12 text-center text-muted-foreground">
      <BookOpenIcon className="size-8" />
      <p>Selecciona un paralelo en el menu lateral.</p>
    </div>
  ),
})
