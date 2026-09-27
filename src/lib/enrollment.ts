/**
 * El estado de una matrícula, en las palabras crudas del backend.
 *
 * Vive acá junto a `labels.ts` y por el mismo motivo que `grading.ts` guarda el umbral de
 * aprobación: es el contrato, y quien compara mira el valor, nunca la etiqueta traducida. Antes
 * estaba escrito a mano en cada pantalla que lo necesitaba — tres copias de la misma cadena, que es
 * una por cada lugar donde un typo pasa desapercibido y deja de reconocer una baja.
 */

/** Lo que la columna `status` guarda para quien salió del padrón. */
export const WITHDRAWN = "Withdrawn"

/** Lo que guarda para quien sigue en él. */
export const EFFECTIVE = "Effective"

/**
 * Si la escuela dio de baja esta matrícula.
 *
 * Sin estado responde `false`, y eso es lo único que agrega sobre comparar con `WITHDRAWN` a mano:
 * mientras un listado carga, sus filas llegan sin estado, y leer esa ausencia como una baja apagaría
 * el curso entero por un instante. Donde el estado ya está garantizado, un `=== WITHDRAWN` dice
 * exactamente lo mismo y no hace falta pasar por acá.
 *
 * La comparación es exacta a propósito. El backend escribe estos dos valores como literales y los
 * compara con `equals`, así que no hay una segunda forma de escribirlos que haya que tolerar.
 * `enrollmentStatusLabel` sí ignora mayúsculas, pero por otro motivo y sobre otros valores: el rol
 * llega como `"Teacher"` de la API y como `"TEACHER"` del store de sesión. Normalizar acá inventaría
 * una variación que el contrato no tiene, y dejaría pasar en silencio un valor que en realidad
 * derivó del esquema.
 */
export const isWithdrawn = (status: string | null | undefined): boolean =>
  status === WITHDRAWN
