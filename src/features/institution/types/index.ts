/**
 * The heading every official document of the school prints. The district and the school name are
 * what the school is; the Director is whoever holds the role, and is absent while nobody does.
 */
export interface Institution {
  district: string
  school: string
  directorName: string | null
}
