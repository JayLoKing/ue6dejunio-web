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
import type { SubjectAssignment } from "../types/course"

type SubjectState = {
  checked: boolean
  teacherId: string | null
}

export function AssignCourseSubjectsForm() {
  const grades = useGrades()
  const parallels = useParallels()
  const subjects = useSubjects()
  const aulaTeachers = useTeachers(false)
  const technicalTeachers = useTeachers(true)

  const [gradeId, setGradeId] = useState<number | undefined>()
  const [parallelId, setParallelId] = useState<number | undefined>()
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string | undefined>()
  const [subjectStates, setSubjectStates] = useState<Record<string, SubjectState>>({})

  const createCourse = useCreateCourse()
  const saving = createCourse.isPending

  const toggleSubject = (id: string, checked: boolean) => {
    setSubjectStates((prev) => ({
      ...prev,
      [id]: { checked, teacherId: prev[id]?.teacherId ?? null },
    }))
  }

  const setSubjectTeacher = (id: string, teacherId: string) => {
    setSubjectStates((prev) => ({
      ...prev,
      [id]: { checked: prev[id]?.checked ?? true, teacherId },
    }))
  }

  const checkedCount = useMemo(
    () => Object.values(subjectStates).filter((s) => s.checked).length,
    [subjectStates],
  )

  const buildAssignments = (): SubjectAssignment[] => {
    const list: SubjectAssignment[] = []
    for (const subject of subjects.data ?? []) {
      const state = subjectStates[subject.id]
      if (!state?.checked) continue
      // Tecnica: docente explicito. Aula: cae al docente de aula.
      const teacher = subject.technical
        ? state.teacherId
        : (state.teacherId ?? homeroomTeacherId)
      if (!teacher) continue
      list.push({ id_subject: subject.id, id_teacher: teacher })
    }
    return list
  }

  const canSubmit = Boolean(
    gradeId &&
      parallelId &&
      homeroomTeacherId &&
      checkedCount > 0,
  )

  const handleSubmit = async () => {
    if (!gradeId || !parallelId) return
    const assignments = buildAssignments()
    if (assignments.length === 0) return
    try {
      // Crea curso + materias en 1 transaccion (POST /courses con assignments).
      await createCourse.mutateAsync({
        id_grade: gradeId,
        id_parallel: parallelId,
        id_homeroom_teacher: homeroomTeacherId,
        assignments,
      })
      // reset (keep grade/parallel for fast re-use)
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
            <GraduationCapIcon className="size-5 text-univalle" />
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
            Marca materias comunes (docente de aula). En Música o Religión
            asigna docente tecnico desde el dropdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando materias...</p>
          ) : (subjects.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin materias configuradas en el catalogo.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(subjects.data ?? []).map((s) => {
                const state = subjectStates[s.id]
                const checked = state?.checked ?? false
                const teacherId = state?.teacherId ?? null
                // Materia tecnica: docente tecnico obligatorio (sin default de aula).
                // Materia de aula: default al docente de aula si no se elige otro.
                const effectiveTeacher = s.technical
                  ? teacherId
                  : (teacherId ?? homeroomTeacherId)
                const options = s.technical
                  ? (technicalTeachers.data ?? [])
                  : (aulaTeachers.data ?? [])
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-md border p-3 transition-colors",
                      checked
                        ? "border-univalle/40 bg-univalle/5"
                        : "border-border",
                    )}
                  >
                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          toggleSubject(s.id, Boolean(v))
                        }
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{s.name}</span>
                        <span
                          className={cn(
                            "text-xs",
                            s.technical
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {s.technical ? "Técnica" : "Aula"}
                        </span>
                      </div>
                    </label>

                    {checked ? (
                      <div className="flex items-center gap-2 pl-7 text-xs">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Docente:</span>
                        <Select
                          value={teacherId ?? undefined}
                          onValueChange={(v) => setSubjectTeacher(s.id, v)}
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue
                              placeholder={
                                s.technical
                                  ? "Selecciona docente técnico"
                                  : homeroomTeacherId
                                    ? `Aula: ${
                                        aulaTeachers.data?.find(
                                          (t) => t.id === homeroomTeacherId,
                                        )?.fullName ?? ""
                                      }`
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
                                  s.technical || t.id !== homeroomTeacherId,
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
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
        >
          <SaveIcon data-icon="inline-start" />
          {saving ? "Guardando..." : "Guardar Curso"}
        </Button>
      </div>
    </div>
  )
}
