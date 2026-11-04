import type { Gender } from "../../types"

/**
 * PUT /students/{id}: la ficha entera, no un parche.
 *
 * La API reemplaza los seis datos, así que un opcional que no viaja queda borrado. Por eso van
 * siempre todos, y uno vacío va como null explícito.
 */
export interface UpdateStudentRequest {
  rudeCode: string | null
  identityCard: string | null
  names: string
  lastNames: string
  /** yyyy-MM-dd. */
  birthDate: string | null
  gender: Gender | null
}
