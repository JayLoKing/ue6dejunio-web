import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useTeacherSubjects } from "@/features/students/hooks/useTeacherStudents"
import { CentralizerTable } from "@/features/gradebook/components/CentralizerTable"
import { PromediosRanking } from "@/features/gradebook/components/PromediosRanking"

export const Route = createLazyFileRoute("/_app/reports")({
  component: ReportsPage,
})

function ReportsPage() {
  const userId = useAuthStore((s) => s.userId)
  const { data: subjects, isLoading } = useTeacherSubjects(userId)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Centralizador, promedios e informe pedagogico del trimestre.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando…
        </div>
      ) : (
        <Tabs defaultValue="centralizador">
          <TabsList>
            <TabsTrigger value="centralizador">Centralizador</TabsTrigger>
            <TabsTrigger value="promedios">Promedios</TabsTrigger>
            <TabsTrigger value="informe">Informe pedagogico</TabsTrigger>
          </TabsList>
          <TabsContent value="centralizador" className="pt-4">
            <CentralizerTable subjects={subjects ?? []} />
          </TabsContent>
          <TabsContent value="promedios" className="pt-4">
            <PromediosRanking subjects={subjects ?? []} />
          </TabsContent>
          <TabsContent value="informe" className="pt-4">
            <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
              Informe de Comision Pedagogica — en desarrollo (requiere input de
              observaciones por estudiante y plantilla exportable).
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
