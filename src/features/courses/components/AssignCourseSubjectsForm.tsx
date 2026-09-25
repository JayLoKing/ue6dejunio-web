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
  useGrades,
  useParallels,
  useSubjects,
  useTeachers,
} from "@/features/catalog/hooks/useCatalog"

import { useCreateCourse } from "../hooks/useCourses"
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
              onValueChange={(v) => setGradeId(Number(v))}
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
            <Select
              value={parallelId ? String(parallelId) : undefined}
              onValueChange={(v) => setParallelId(Number(v))}
              disabled={parallels.isLoading}
            >
              <SelectTrigger id="parallel">
                <SelectValue placeholder="Selecciona paralelo" />
              </SelectTrigger>
              <SelectContent>
                {(parallels.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="homeroom">Docente de aula</FieldLabel>
            <Select
              value={homeroomTeacherId}
              onValueChange={setHomeroomTeacherId}
              disabled={aulaTeachers.isLoading}
            >
              <SelectTrigger id="homeroom">
                <SelectValue placeholder="Selecciona docente principal" />
              </SelectTrigger>
              <SelectContent>
                {(aulaTeachers.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName}
                  </SelectItem>
                ))}
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
                              ? "text-amber-600 dark:text-amber-400"
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
