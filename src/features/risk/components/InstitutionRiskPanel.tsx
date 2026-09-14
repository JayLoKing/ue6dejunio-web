import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { useInstitutionRisk } from "../hooks/useRisk"
import { InstitutionRiskTable } from "./InstitutionRiskTable"

export interface InstitutionRiskPanelProps {
  /** The row id of the gestión. `id_academic_year` is a SERIAL, not the calendar year. */
  academicYearId: number | null
  trimester: number
  /** How many students the list holds. */
  places: number
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
}: InstitutionRiskPanelProps) {
  const risks = useInstitutionRisk(academicYearId, trimester, places)

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

  // Una consulta que falló no puede caer en la tabla vacía. "Sin predicciones" es una respuesta
  // — nadie en riesgo este trimestre — y es exactamente la contraria a "no se pudo preguntar".
  // Dirección leería que la escuela está bien justo el día en que no lo está.
  if (risks.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar la lista de la unidad educativa. Reintenta en un
        momento.
      </p>
    )
  }

  return <InstitutionRiskTable rows={rows} />
}
