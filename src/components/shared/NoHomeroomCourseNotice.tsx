/**
 * El aviso para el docente de aula al que la Dirección todavía no le asignó un curso.
 *
 * No tener curso de aula no lo vuelve técnico: eso lo dice `isTechnical`, y el técnico tiene sus
 * propias pantallas. Este docente sólo está esperando su curso, y se le dice qué verá cuando llegue.
 */
interface NoHomeroomCourseNoticeProps {
  /** Lo que la pantalla mostrará con el curso, p. ej. "el padrón del curso". */
  whatYouWillSee: string
}

export function NoHomeroomCourseNotice({
  whatYouWillSee,
}: NoHomeroomCourseNoticeProps) {
  return (
    <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
      Aún no tienes un curso de aula asignado. Cuando la Dirección te asigne
      uno, aquí verás {whatYouWillSee}.
    </div>
  )
}
