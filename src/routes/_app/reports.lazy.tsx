import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { CentralizerTable } from "@/features/gradebook/components/CentralizerTable"
import { AverageRanking } from "@/features/gradebook/components/AverageRanking"
import { AnnualSheetsPanel } from "@/features/gradebook/components/AnnualSheetsPanel"

export const Route = createLazyFileRoute("/_app/reports")({
  component: ReportsPage,
})

function ReportsPage() {
  const { homeroomCourseId, isLoading } = useCurrentContext()

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Centralizador, promedios e informe pedagógico del curso.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando…
        </div>
      ) : !homeroomCourseId ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          El centralizador es del curso de aula. Como docente técnico no tienes
          un curso de aula asignado.
        </div>
      ) : (
        <Tabs defaultValue="centralizador">
          <TabsList>
            <TabsTrigger value="centralizador">Centralizador</TabsTrigger>
            <TabsTrigger value="anual">Cierre de gestión</TabsTrigger>
            <TabsTrigger value="promedios">Promedios</TabsTrigger>
            <TabsTrigger value="informe">Informe pedagógico</TabsTrigger>
          </TabsList>
          <TabsContent value="centralizador" className="pt-4">
            <CentralizerTable courseId={homeroomCourseId} />
          </TabsContent>
          <TabsContent value="anual" className="pt-4">
            <AnnualSheetsPanel courseId={homeroomCourseId} />
          </TabsContent>
          <TabsContent value="promedios" className="pt-4">
            <AverageRanking courseId={homeroomCourseId} />
          </TabsContent>
          <TabsContent value="informe" className="pt-4">
            <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
              Informe de Comisión Pedagógica — en desarrollo.
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
