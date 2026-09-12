import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { statusOf } from "@/lib/grading"

import { useAnnualCentralizer } from "../hooks/useGradebook"
import { AnnualCentralizerTable } from "./AnnualCentralizerTable"
import { AnnualRanking } from "./AnnualRanking"
import { TrimesterAveragesTable } from "./TrimesterAveragesTable"
import type { StudentAnnualSummary } from "../types"

export interface AnnualSheetsPanelProps {
  courseId: string
}

/**
 * Las tres hojas de cierre del cuaderno anual de la escuela, de una sola consulta: la matriz por
 * área, los promedios por trimestre y el ranking. Son vistas de un mismo payload, así que los
 * números de las tres pestañas no pueden separarse entre sí.
 */
export function AnnualSheetsPanel({ courseId }: AnnualSheetsPanelProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const query = useMemo(
    () => ({ offset: page, limit, sort: "asc" as const }),
    [page, limit]
  )
  const { data, isLoading, isFetching } = useAnnualCentralizer(courseId, query)

  const rows = useMemo<StudentAnnualSummary[]>(() => data?.content ?? [], [data])

  const counters = useMemo(() => {
    let passed = 0
    let failed = 0
    let ungraded = 0
    for (const r of rows) {
      if (r.finalAverage == null) ungraded++
      else if (statusOf(Number(r.finalAverage)) === "APROBADO") passed++
      else failed++
    }
    return { passed, failed, ungraded }
  }, [rows])

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cierre de gestión del curso. Los promedios de área son el promedio de
          sus tres trimestres, sin ponderación.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{counters.passed} aprobados</Badge>
          <Badge variant="outline" className="text-destructive">
            {counters.failed} reprobados
          </Badge>
          {counters.ungraded > 0 && (
            <Badge variant="outline">{counters.ungraded} sin calificar</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="anual">
        <TabsList>
          <TabsTrigger value="anual">Centralizador anual</TabsTrigger>
          <TabsTrigger value="trimestres">Promedios por trimestre</TabsTrigger>
          <TabsTrigger value="cronologia">Promedio anual</TabsTrigger>
        </TabsList>
        <TabsContent value="anual" className="pt-4">
          <AnnualCentralizerTable rows={rows} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="trimestres" className="pt-4">
          <TrimesterAveragesTable rows={rows} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="cronologia" className="pt-4">
          <AnnualRanking rows={rows} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setLimit(s)
          setPage(1)
        }}
      />
    </div>
  )
}
