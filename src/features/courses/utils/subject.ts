/**
 * Las materias técnicas, para marcarlas visualmente. Ajustar si el backend cambia los nombres.
 *
 * "educacion musical" es redundante y queda igual: normalizado contiene "musica", así que ya
 * entraba por la segunda entrada. Sacarla obligaría al próximo lector a rehacer esa comprobación
 * para convencerse de que no falta nada.
 */
const TECHNICAL_SUBJECTS = ["religion", "musica", "educacion musical"]

/**
 * Baja a minúsculas y saca los acentos, para que "Religión" coincida igual que "Religion".
 *
 * El rango va escapado a propósito. Escrito con los signos combinantes literales el corchete se ve
 * vacío, y cualquier reformateo o copiado que los normalice cambia la clase sin error: a partir de
 * ahí "Religión" deja de ser materia técnica y nada lo avisa.
 */
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

export const isTechnicalSubject = (subjectName: string): boolean => {
  const n = normalize(subjectName)
  return TECHNICAL_SUBJECTS.some((t) => n.includes(t))
}
