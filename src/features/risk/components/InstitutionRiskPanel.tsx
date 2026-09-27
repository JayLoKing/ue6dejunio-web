import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { ExportReportButton } from "@/components/shared/ExportReportButton"
import { useInstitution } from "@/features/institution/hooks/useInstitution"
import { riskReportRows } from "@/lib/reportRows"

import { useInstitutionRisk } from "../hooks/useRisk"
import { InstitutionRiskTable } from "./InstitutionRiskTable"

/** RF 36: the student's name, their classroom, the worst subject, the category and its probability. */
const COLUMNS = [
  { header: "Estudiante", width: 3400 },
  { header: "Curso", width: 1300, align: "center" as const },
  { header: "Materia", width: 2200 },
  { header: "Riesgo", width: 1400, align: "center" as const },
  { header: "Probabilidad", width: 1400, align: "center" as const },
]

export interface InstitutionRiskPanelProps {
  /** The row id of the gestión. `id_academic_year` is a SERIAL, not the calendar year. */
  academicYearId: number | null
  trimester: number
  /** How many students the list holds. */
  places: number
  /** The calendar year, for the document's own scope line. Not the SERIAL above. */
  year?: number | null
}

/**
 * The students of the whole school closest to failing this trimester.
 *
 * One row per student rather than one per subject, which is what separates this from the course
 * panel beside it: that one is read by somebody who teaches those nine subjects and wants each of
 * them, while a fixed number of places spent at subject grain can all go to one child and displace
 * the others Dirección opened the list to find. The subject shown is the student's worst.
 */
export function InstitutionRiskPanel({
  academicYearId,
  trimester,
  places,
  year,
}: InstitutionRiskPanelProps) {
  const risks = useInstitutionRisk(academicYearId, trimester, places)
  const { data: school } = useInstitution()

  const rows = useMemo(() => risks.data ?? [], [risks.data])

  if (academicYearId === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin gestión activa: la lista de toda la unidad educativa es de un año a
        la vez.
      </p>
    )
  }

  if (risks.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando la lista de la unidad educativa…
      </div>
    )
  }

  // A failed query must not fall into the empty table. "Sin predicciones" is an answer — nobody at
  // risk this trimester — and it is the exact opposite of "the question could not be asked".
  // Dirección would read that the school is fine on the very day it is not.
  if (risks.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar la lista de la unidad educativa. Reintenta en un
        momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <ExportReportButton
          school={school}
          title="REPORTE DE ESTUDIANTES EN RIESGO"
          subtitles={[
            "Alcance: unidad educativa",
            `Gestión ${year ?? ""}`.trim(),
            `Trimestre ${trimester}`,
          ]}
          columns={COLUMNS}
          rows={riskReportRows(rows)}
          emptyLabel="Sin predicciones registradas para este trimestre."
          filename={`riesgo-unidad-educativa-${year ?? "gestion"}-t${trimester}`}
        />
      </div>
      <InstitutionRiskTable rows={rows} />
    </div>
  )
}
