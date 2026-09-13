/**
 * The heading every official document of the school prints. Everything but the Director is what
 * the school is; the Director is whoever holds the role, and is absent while nobody does.
 *
 * The libreta and the informe pedagógico print the four below as well, and none of them varies by
 * course, student or year — which is why they are read once here and not carried in every
 * document's payload.
 */
export interface Institution {
  district: string
  school: string
  directorName: string | null
  department: string
  dependency: string
  shift: string
  educationLevel: string
}
