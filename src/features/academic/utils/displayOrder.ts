/**
 * Si lo tipeado sirve como posición en el plan.
 *
 * Vacío es una respuesta válida y significa "decidilo vos": al crear un área la manda al final, al
 * editarla la deja donde está. Lo que no vale es un número que no sea una posición — la columna
 * guarda enteros, y "1.5" pasaría un "mayor o igual a 1" para llegar truncado a la base.
 */
export const isValidDisplayOrder = (raw: string): boolean => {
  const value = raw.trim()
  if (value === "") return true
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1
}

/** Lo tipeado como lo espera la API: un entero, o nada cuando se dejó en blanco. */
export const toDisplayOrder = (raw: string): number | undefined => {
  const value = raw.trim()
  return value === "" ? undefined : Number(value)
}
