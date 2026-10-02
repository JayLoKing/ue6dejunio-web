import type { AcademicYearItem } from "../types"

/**
 * La gestión que el Director declaró activa. Es la única definición de "la actual": ya no es la
 * más reciente, así que crear 2027 con 2026 en curso no mueve las pantallas.
 *
 * Sin ninguna activa devuelve `undefined` y cada pantalla toma su camino de "sin datos"; caer a la
 * primera de la lista reintroduciría el error que esto corrige.
 */
export const activeAcademicYear = (
  years: readonly AcademicYearItem[] | undefined
): AcademicYearItem | undefined => years?.find((year) => year.active)
