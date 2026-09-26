/**
 * Cómo se nombran en pantalla las palabras que la API guarda en inglés.
 *
 * La traducción vive acá y no en la API a propósito: los valores son el contrato: `"Teacher"`,
 * `"Effective"`. Traducirlos en el servidor rompería a todo cliente que compare contra ellos, y
 * ninguna comparación de esta interfaz mira estas etiquetas — miran el valor crudo.
 *
 * Vive en `src/lib` y no en una feature porque las tres son de varias: el rol lo pinta la tabla de
 * Usuarios y también el pie de la barra lateral, y el estado de matrícula lo pintan dos tablas de
 * estudiantes distintas. Es el mismo lugar donde ya vive `grading.ts` con el umbral de aprobación.
 *
 * Dos ausencias distintas, y las dos deliberadas. Un valor que la tabla no conoce se muestra tal
 * cual: inventarle una traducción a algo que el backend agregó después dice menos que el original.
 * Un valor ausente responde vacío, y qué significa eso lo decide quien llama — "Sin rol" en un
 * perfil no es lo mismo que una celda en blanco en un listado.
 */

const ROLES: Record<string, string> = {
  director: "Director",
  secretary: "Secretario",
  teacher: "Docente",
}

const ENROLLMENT_STATUSES: Record<string, string> = {
  effective: "Activo",
  withdrawn: "Dado de baja",
}

/**
 * Sin distinguir mayúsculas: la API responde `"Teacher"` y el store de sesión guarda `"TEACHER"`.
 * Mirar una sola de las dos formas dejaría media interfaz en inglés.
 */
const translate = (
  table: Record<string, string>,
  value: string | null | undefined
): string => (value ? (table[value.toLowerCase()] ?? value) : "")

/** El rol de un usuario, como lo nombra la unidad educativa. */
export const roleLabel = (role: string | null | undefined): string =>
  translate(ROLES, role)

/**
 * Qué tono lleva la insignia del rol. Acá y no en la tabla que la pinta: es el mismo conjunto de
 * valores que traduce el mapa de arriba, y separados se normalizaban dos veces, en dos cajas
 * distintas. Un rol nuevo se agrega en un solo archivo o no se agrega.
 */
export const roleBadgeVariant = (
  role: string | null | undefined
): "default" | "secondary" | "outline" => {
  switch (role?.toLowerCase()) {
    case "director":
      return "default"
    case "secretary":
      return "secondary"
    default:
      return "outline"
  }
}

/** El estado de una matrícula: activa, o dada de baja. */
export const enrollmentStatusLabel = (
  status: string | null | undefined
): string => translate(ENROLLMENT_STATUSES, status)
