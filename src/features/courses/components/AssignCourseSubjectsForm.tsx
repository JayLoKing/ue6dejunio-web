import { useMemo, useState } from "react"
import { GraduationCapIcon, SaveIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  useAcademicYears,
  useGrades,
  useParallels,
  useSubjects,
  useTeachers,
} from "@/features/catalog/hooks/useCatalog"

import { useAllCourses, useCreateCourse } from "../hooks/useCourses"
import { homeroomCourses, takenParallels } from "../utils/courseAvailability"
import {
  resolveSubjectTeacher,
  type SubjectTeacherChoice,
} from "../utils/subjectTeacher"
import type { SubjectAssignment } from "../types/course"

/**
 * Lo elegido para una materia. Extiende lo que la regla necesita para resolver al docente, así las
 * dos formas no se separan cuando una de ellas cambie.
 */
interface SubjectState extends SubjectTeacherChoice {
  checked: boolean
}

export function AssignCourseSubjectsForm() {
  const grades = useGrades()
  const parallels = useParallels()
  const subjects = useSubjects()
  const aulaTeachers = useTeachers(false)
  const technicalTeachers = useTeachers(true)
  const academicYears = useAcademicYears()
  const allCourses = useAllCourses()

  const [gradeId, setGradeId] = useState<number | undefined>()
  const [parallelId, setParallelId] = useState<number | undefined>()
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<
    string | undefined
  >()
  const [subjectStates, setSubjectStates] = useState<
    Record<string, SubjectState>
  >({})

  const createCourse = useCreateCourse()
  const saving = createCourse.isPending

  /**
   * La gestión que se está armando. La primera de la lista es la actual — así las ordena el
   * backend — y es la única contra la que se mide qué está ocupado: `POST /courses` crea el curso
   * en la gestión en curso, y un paralelo o un docente de aula del año pasado no ocupan nada hoy.
   */
  const currentAcademicYearId = academicYears.data?.[0]?.id ?? null
  const courses = useMemo(
    () => allCourses.data?.content ?? [],
    [allCourses.data]
  )

  /**
   * Mientras los cursos o la gestión no estén, ninguna de las dos reglas puede afirmar nada, y
   * ofrecer opciones que un instante después se deshabilitan solas es peor que esperar: la persona
   * elige mirando un cartel que todavía no es cierto. Mismo criterio que SetHomeroomDialog.
   */
  const availabilityUnknown =
    allCourses.isLoading || academicYears.isLoading || !currentAcademicYearId

  /** El curso que ya ocupa cada paralelo del grado elegido. Vacío sin grado. */
  const parallelTakenBy = useMemo(
    () => takenParallels(courses, currentAcademicYearId, gradeId),
    [courses, currentAcademicYearId, gradeId]
  )

  /** El curso del que cada docente ya es encargado: dos cursos a la vez no existe. */
  const homeroomOf = useMemo(
    () => homeroomCourses(courses, currentAcademicYearId),
    [courses, currentAcademicYearId]
  )

  /**
   * Cambiar de grado puede volver imposible el paralelo que ya estaba elegido. Dejarlo puesto
   * mandaría a guardar una combinación que la propia pantalla dibuja deshabilitada, y el 409 del
   * backend llegaría después de apretar.
   */
  const chooseGrade = (nextGradeId: number) => {
    setGradeId(nextGradeId)
    const takenInNextGrade = takenParallels(
      courses,
      currentAcademicYearId,
      nextGradeId
    )
    if (parallelId !== undefined && takenInNextGrade.has(parallelId)) {
      setParallelId(undefined)
    }
  }

  const toggleSubject = (id: string, checked: boolean) => {
    setSubjectStates((prev) => ({
      ...prev,
      [id]: {
        checked,
        teacherId: prev[id]?.teacherId ?? null,
        byHomeroom: prev[id]?.byHomeroom ?? false,
      },
    }))
  }

  const setSubjectTeacher = (id: string, teacherId: string) => {
    setSubjectStates((prev) => ({
      ...prev,
      [id]: {
        checked: prev[id]?.checked ?? true,
        teacherId,
        byHomeroom: prev[id]?.byHomeroom ?? false,
      },
    }))
  }

  /**
   * Pasa una materia técnica al docente de aula, y viceversa.
   *
   * Al marcar se olvida el técnico que estuviera elegido: dejarlo guardado haría que desmarcar
   * reviviera una elección que la persona ya descartó.
   */
  const setTaughtByHomeroom = (id: string, byHomeroom: boolean) => {
    setSubjectStates((prev) => ({
      ...prev,
      [id]: {
        checked: prev[id]?.checked ?? true,
        teacherId: byHomeroom ? null : (prev[id]?.teacherId ?? null),
        byHomeroom,
      },
    }))
  }

  const checkedCount = useMemo(
    () => Object.values(subjectStates).filter((s) => s.checked).length,
    [subjectStates]
  )

  /** El nombre del docente de aula elegido arriba, para no repetir la búsqueda por fila. */
  const aulaTeacherName = useMemo(
    () =>
      aulaTeachers.data?.find((t) => t.id === homeroomTeacherId)?.fullName ??
      "",
    [aulaTeachers.data, homeroomTeacherId]
  )

  const assignments = useMemo<SubjectAssignment[]>(() => {
    const list: SubjectAssignment[] = []
    for (const subject of subjects.data ?? []) {
      const state = subjectStates[subject.id]
      if (!state?.checked) continue
      const teacher = resolveSubjectTeacher(
        subject.technical,
        state,
        homeroomTeacherId
      )
      if (!teacher) continue
      list.push({ id_subject: subject.id, id_teacher: teacher })
    }
    return list
  }, [subjects.data, subjectStates, homeroomTeacherId])

  /**
   * Toda materia marcada tiene que llegar con docente.
   *
   * Antes bastaba con haber marcado alguna: una materia sin docente se caía en silencio al armar
   * el envío, así que el curso se guardaba sin ella mientras la fila mostraba su aviso. La pantalla
   * avisaba y el guardado ignoraba el aviso.
   */
  const canSubmit = Boolean(
    gradeId &&
    parallelId &&
    homeroomTeacherId &&
    checkedCount > 0 &&
    assignments.length === checkedCount
  )

  const handleSubmit = async () => {
    if (!gradeId || !parallelId) return
    if (assignments.length === 0) return
    try {
      // Crea curso + materias en 1 transacción (POST /courses con assignments).
      await createCourse.mutateAsync({
        id_grade: gradeId,
        id_parallel: parallelId,
        id_homeroom_teacher: homeroomTeacherId,
        assignments,
      })
      // Reset, conservando grado y paralelo para volver a usarlos.
      setSubjectStates({})
    } catch {
      /* toast via interceptor */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCapIcon className="size-5 text-brand" />
            Curso
          </CardTitle>
          <CardDescription>
            Elige grado, paralelo y docente de aula.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="grade">Grado</FieldLabel>
            <Select
              value={gradeId ? String(gradeId) : undefined}
              onValueChange={(v) => chooseGrade(Number(v))}
              disabled={grades.isLoading}
            >
              <SelectTrigger id="grade">
                <SelectValue placeholder="Selecciona grado" />
              </SelectTrigger>
              <SelectContent>
                {(grades.data ?? []).map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name} — {g.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="parallel">Paralelo</FieldLabel>
            {/* Cadena vacía y no `undefined` para "sin elegir": pasar `undefined` después de haber
                tenido un valor le devuelve el control a Radix, que conserva el último internamente,
                y el disparador seguía mostrando el paralelo que este formulario acababa de soltar.
                "" no coincide con ningún item, así que vuelve el placeholder. */}
            <Select
              value={parallelId === undefined ? "" : String(parallelId)}
              onValueChange={(v) => setParallelId(Number(v))}
              disabled={parallels.isLoading || availabilityUnknown}
            >
              <SelectTrigger id="parallel">
                <SelectValue placeholder="Selecciona paralelo" />
              </SelectTrigger>
              <SelectContent>
                {/* Una opción deshabilitada sin motivo se lee como un error del sistema, así que
                    cada una dice qué curso la ocupa. */}
                {(parallels.data ?? []).map((p) => {
                  const takenBy = parallelTakenBy.get(p.id)
                  return (
                    <SelectItem
                      key={p.id}
                      value={String(p.id)}
                      disabled={Boolean(takenBy)}
                    >
                      {p.name}
                      {takenBy ? (
                        <span className="text-xs text-muted-foreground">
                          Ya existe {takenBy.gradeName} {takenBy.parallelName}
                        </span>
                      ) : null}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="homeroom">Docente de aula</FieldLabel>
            <Select
              value={homeroomTeacherId}
              onValueChange={setHomeroomTeacherId}
              disabled={aulaTeachers.isLoading || availabilityUnknown}
            >
              <SelectTrigger id="homeroom">
                <SelectValue placeholder="Selecciona docente principal" />
              </SelectTrigger>
              <SelectContent>
                {/* Nadie es docente de aula de dos cursos a la vez. Acá se deshabilita a quien ya
                    lo es, y el diálogo de reasignación hace lo contrario a propósito: ahí elegir a
                    un docente ya encargado es lo que habilita un intercambio. Dos pantallas, dos
                    reglas opuestas — ver SetHomeroomDialog. */}
                {(aulaTeachers.data ?? []).map((t) => {
                  const runs = homeroomOf.get(t.id)
                  return (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={Boolean(runs)}
                    >
                      {t.fullName}
                      {runs ? (
                        <span className="text-xs text-muted-foreground">
                          Es docente de aula de {runs.gradeName}{" "}
                          {runs.parallelName}
                        </span>
                      ) : null}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materias</CardTitle>
          <CardDescription>
            Marca materias comunes (docente de aula). En Música o Religión elige
            un docente técnico, o marca que la dicta el docente de aula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando materias…</p>
          ) : (subjects.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin materias configuradas en el catálogo.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(subjects.data ?? []).map((s) => {
                const state = subjectStates[s.id]
                const checked = state?.checked ?? false
                const teacherId = state?.teacherId ?? null
                const byHomeroom = state?.byHomeroom ?? false
                // La misma regla con la que se arma el envío, para que el aviso de "falta docente"
                // no pueda decir una cosa y el guardado hacer otra.
                const effectiveTeacher = resolveSubjectTeacher(
                  s.technical,
                  state,
                  homeroomTeacherId
                )
                const options = s.technical
                  ? (technicalTeachers.data ?? [])
                  : (aulaTeachers.data ?? [])
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-md border p-3 transition-colors",
                      checked ? "border-brand/40 bg-brand/5" : "border-border"
                    )}
                  >
                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleSubject(s.id, Boolean(v))}
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{s.name}</span>
                        <span
                          className={cn(
                            "text-xs",
                            s.technical
                              ? "text-warning"
                              : "text-muted-foreground"
                          )}
                        >
                          {s.technical ? "Técnica" : "Aula"}
                        </span>
                      </div>
                    </label>

                    {checked ? (
                      <div className="flex flex-col gap-2 pl-7">
                        {/* Quién la dicta se decide antes que cuál de ellos: marcada, el selector
                            de técnicos no tiene nada que ofrecer. */}
                        {s.technical ? (
                          <label className="flex items-center gap-2 text-xs">
                            <Checkbox
                              checked={byHomeroom}
                              disabled={!homeroomTeacherId}
                              onCheckedChange={(v) =>
                                setTaughtByHomeroom(s.id, Boolean(v))
                              }
                            />
                            <span className="text-muted-foreground">
                              La dicta el docente de aula del curso
                            </span>
                          </label>
                        ) : null}
                        <div className="flex items-center gap-2 text-xs">
                          <UserIcon className="size-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Docente:
                          </span>
                          <Select
                            value={teacherId ?? undefined}
                            disabled={s.technical && byHomeroom}
                            onValueChange={(v) => setSubjectTeacher(s.id, v)}
                          >
                            <SelectTrigger className="h-8 flex-1 text-xs">
                              <SelectValue
                                placeholder={
                                  s.technical
                                    ? byHomeroom
                                      ? aulaTeacherName
                                      : "Selecciona docente técnico"
                                    : homeroomTeacherId
                                      ? `Aula: ${aulaTeacherName}`
                                      : "Selecciona docente"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {!s.technical && homeroomTeacherId ? (
                                <SelectItem value={homeroomTeacherId}>
                                  Docente de aula
                                </SelectItem>
                              ) : null}
                              {options
                                .filter(
                                  (t) =>
                                    s.technical || t.id !== homeroomTeacherId
                                )
                                .map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.fullName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {!effectiveTeacher ? (
                            <span className="text-destructive">!</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {checkedCount} materia(s) seleccionada(s)
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <SaveIcon data-icon="inline-start" />
          {saving ? "Guardando…" : "Guardar Curso"}
        </Button>
      </div>
    </div>
  )
}
