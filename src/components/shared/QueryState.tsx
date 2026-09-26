export interface NoticeProps {
  children: string
}

/**
 * Un aviso centrado dentro de una tarjeta. Lo que se ve cuando no hay gráfico que dibujar.
 */
export function Notice({ children }: NoticeProps) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  )
}

export interface QueryStateProps {
  isPending: boolean
  isError: boolean
  /**
   * Si la consulta terminó bien y no trajo nada. Se omite cuando el contenido siempre se puede
   * dibujar — una línea de tendencia con huecos sigue siendo una línea.
   */
  isEmpty?: boolean
  /**
   * Qué decir cuando está vacío.
   *
   * Depende de `isEmpty` y el tipo no lo exige a propósito. Una unión discriminada lo haría
   * verificable en compilación, pero sólo cuando `isEmpty` es el literal `true`; acá siempre es
   * una expresión (`rows.length === 0`), así que no estrecharía en ninguna de las llamadas y el
   * costo lo pagarían todas.
   */
  empty?: string
  children: React.ReactNode
}

/**
 * Las tres situaciones de una consulta, que se veían iguales.
 *
 * Mientras carga, la lista está vacía; si falló, también. Sin separarlas, la primera pintada
 * afirma que la escuela no tiene datos y después se corrige sola, y un error dice lo mismo — que
 * es peor, porque afirma que no pasó nada cuando lo cierto es que no se pudo preguntar.
 *
 * El orden importa: el error gana sobre todo lo demás. Una consulta que falló y reintenta vuelve a
 * estar pendiente, y mostrar "Cargando…" ahí esconde que algo se rompió.
 */
export function QueryState({
  isPending,
  isError,
  isEmpty = false,
  empty = "",
  children,
}: QueryStateProps) {
  if (isError) return <Notice>No se pudo cargar la información.</Notice>
  if (isPending) return <Notice>Cargando…</Notice>
  if (isEmpty) return <Notice>{empty}</Notice>
  return <>{children}</>
}
