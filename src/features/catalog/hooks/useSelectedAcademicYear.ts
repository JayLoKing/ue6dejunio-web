import { useState } from "react"

import type { AcademicYearItem } from "../types"
import { activeAcademicYear } from "../utils/activeAcademicYear"

/**
 * La gestión que una pantalla está mirando: la que eligió la persona y, mientras nadie eligió, la
 * activa. Derivada y no sincronizada en un efecto. Sin activa no hay caída a la primera de la
 * lista: el Director elige o activa una en Gestiones.
 */
export function useSelectedAcademicYear(
  years: readonly AcademicYearItem[] | undefined
) {
  const [chosenYearId, setChosenYearId] = useState<number | null>(null)
  const academicYearId = chosenYearId ?? activeAcademicYear(years)?.id ?? null
  const selectedYear = years?.find((y) => y.id === academicYearId)
  return { academicYearId, selectedYear, choose: setChosenYearId }
}
