import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeachers } from "@/features/catalog/hooks/useCatalog"

import { useSetHomeroom } from "../hooks/useCourses"
import type { Course } from "../types/course"

export interface SetHomeroomDialogProps {
  course: Course | null
  onClose: () => void
}

export function SetHomeroomDialog({ course, onClose }: SetHomeroomDialogProps) {
  return (
    <Dialog open={Boolean(course)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed by the course it edits, so the selection starts from that course's current
            homeroom teacher. Seeding the same state from an effect re-ran on every render the
            course prop changed identity in, including plain refetches. */}
        {course ? (
          <SetHomeroomForm key={course.id} course={course} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

interface SetHomeroomFormProps {
  course: Course
  onClose: () => void
}

function SetHomeroomForm({ course, onClose }: SetHomeroomFormProps) {
  const aulaTeachers = useTeachers(false)
  const setHomeroom = useSetHomeroom()
  const [teacherId, setTeacherId] = useState<string | undefined>(
    course.homeroomTeacherId ?? undefined
  )

  // Solo un docente puede ser de aula de un curso a la vez. Mientras el docente actual siga
  // activo, la reasignación queda bloqueada aquí (no solo en el backend): el Director primero
  // le da de baja la cuenta en Usuarios y recién entonces esta pantalla deja elegir a otra
  // persona.
  const blockedByActiveTeacher = Boolean(
    course.homeroomTeacherId && course.homeroomTeacherActive
  )

  const submit = async () => {
    if (!teacherId || blockedByActiveTeacher) return
    try {
      await setHomeroom.mutateAsync({ id: course.id, teacherId })
      onClose()
    } catch {
      /* toast via interceptor */
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Docente de aula</DialogTitle>
        <DialogDescription>
          {`${course.gradeName} ${course.parallelName}`}
        </DialogDescription>
      </DialogHeader>

      {blockedByActiveTeacher ? (
        <p className="text-sm text-muted-foreground">
          <strong>{course.homeroomTeacherName}</strong> sigue activo como
          docente de aula de este curso. Para reasignarlo, primero dale de baja
          en Usuarios.
        </p>
      ) : null}

      <Field>
        <FieldLabel htmlFor="sh-teacher">Docente</FieldLabel>
        <Select
          value={teacherId}
          onValueChange={setTeacherId}
          disabled={aulaTeachers.isLoading || blockedByActiveTeacher}
        >
          <SelectTrigger id="sh-teacher">
            <SelectValue placeholder="Selecciona docente de aula" />
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

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={
            !teacherId || setHomeroom.isPending || blockedByActiveTeacher
          }
          onClick={submit}
        >
          {setHomeroom.isPending ? "Guardando…" : "Asignar"}
        </Button>
      </DialogFooter>
    </>
  )
}
