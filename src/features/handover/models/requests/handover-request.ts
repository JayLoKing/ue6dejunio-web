/**
 * El correo nombra al reemplazante. CI, nombres y apellidos hacen falta sólo si ese correo no
 * pertenece a nadie todavía; si ya es de alguien, la API lo asciende y los ignora.
 */
export interface StartHandoverRequest {
  email: string
  ci?: string
  names?: string
  lastNames?: string
  phone?: string
}
