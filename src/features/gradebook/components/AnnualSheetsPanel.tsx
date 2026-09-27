import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { ExportReportButton } from "@/components/shared/ExportReportButton"
import { useInstitution } from "@/features/institution/hooks/useInstitution"
import { statusOf } from "@/lib/grading"
import {
  centralizerColumns,
  centralizerRows,
} from "@/features/reports/utils/reportRows"

import { useAnnualCentralizer } from "../hooks/useGradebook"
import { AnnualCentralizerTable } from "./AnnualCentralizerTable"
import { AnnualRanking } from "./AnnualRanking"
import { TrimesterAveragesTable } from "./TrimesterAveragesTable"
import type { StudentAnnualSummary } from "../types"

/** Una página que alcanza para un curso entero: el documento no puede salir cortado por la mitad. */
const WHOLE_COURSE = { offset: 1, limit: 200, sort: "asc" as const }

export interface AnnualSheetsPanelProps {
  courseId: string
  /** Cómo nombrar el curso en el documento. Sin esto no se ofrece exportar. */
  courseLabel?: string
  /** La gestión, para que el consolidado declare de qué año habla. */
  year?: number | null
}

/**
 * Las tres hojas de cierre del cuaderno anual de la escuela, de una sola consulta: la matriz por
 * área, los promedios por trimestre y el ranking. Son vistas de un mismo payload, así que los
 * números de las tres pestañas no pueden separarse entre sí.
 */
export function AnnualSheetsPanel({
  courseId,
  courseLabel,
  year,
}: AnnualSheetsPanelProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const query = useMemo(
    () => ({ offset: page, limit, sort: "asc" as const }),
    [page, limit]
  )
  const { data, isLoading, isFetching } = useAnnualCentralizer(courseId, query)
  const { data: school } = useInstitution()

  // El documento lleva el curso entero, no la página que se está mirando: un consolidado que empieza
  // en el estudiante veintiuno no es un consolidado. Es una segunda consulta, del mismo tamaño que la
  // que `ReportCardPanel` ya hace para su selector, y react-query la comparte si coinciden.
  const { data: wholeCourse } = useAnnualCentralizer(courseId, WHOLE_COURSE)
  const exportRows = useMemo<StudentAnnualSummary[]>(
    () => wholeCourse?.content ?? [],
    [wholeCourse]
  )

  const rows = useMemo<StudentAnnualSummary[]>(
    () => data?.content ?? [],
    [data]
  )

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
          {courseLabel ? (
            <ExportReportButton
              school={school}
              title="CONSOLIDADO DE CALIFICACIONES"
              subtitles={[
                `Curso: ${courseLabel}`,
                `Gestión ${year ?? ""}`.trim(),
                "Alcance anual",
              ]}
              columns={centralizerColumns(exportRows)}
              rows={centralizerRows(exportRows)}
              emptyLabel="Sin estudiantes matriculados en este curso."
              filename={`consolidado-${courseLabel.replace(/\s+/g, "-").toLowerCase()}-${year ?? "gestion"}`}
            />
          ) : null}
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
