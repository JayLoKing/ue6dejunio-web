import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_app/scores")({
  component: ScoresPage,
})

function ScoresPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Cuaderno pedagogico de notas</h1>
      <p className="text-muted-foreground">
        Sabana de notas cargada en chunk separado.
      </p>
    </div>
  )
}
