import { createFileRoute } from "@tanstack/react-router"
import { ConstructionIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useGrades, useParallels } from "@/features/catalog/hooks/useCatalog"

export const Route = createFileRoute("/_app/cursos/$parallelId")({
  component: ParallelCoursesPage,
})

function ParallelCoursesPage() {
  const { parallelId } = Route.useParams()
  const parallels = useParallels()
  const grades = useGrades()

  const parallel = parallels.data?.find((p) => String(p.id) === parallelId)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Paralelo {parallel?.name ?? parallelId}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(grades.data ?? []).map((g) => (
          <Card key={g.id} className="opacity-80">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <ConstructionIcon className="size-6 text-univalle" />
              <span className="font-medium">{g.name}</span>
              <span className="text-xs text-muted-foreground">
                En proceso de desarrollo
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
