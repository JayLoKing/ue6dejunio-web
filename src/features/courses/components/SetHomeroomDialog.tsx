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

import {
  useAllCourses,
  useSetHomeroom,
  useSwapHomeroom,
} from "../hooks/useCourses"
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
  const allCourses = useAllCourses()
  const setHomeroom = useSetHomeroom()
  const swapHomeroom = useSwapHomeroom()
  const [teacherId, setTeacherId] = useState<string | undefined>(
    course.homeroomTeacherId ?? undefined
  )

  const sameAsCurrent = teacherId === course.homeroomTeacherId

  // El docente elegido ya es de aula de OTRO curso: no es una reasignación llana, es exactamente
  // el caso que habilita un intercambio (dos docentes de aula activos que cambian de curso).
  const swapWith = allCourses.data?.content.find(
    (c) => c.id !== course.id && c.homeroomTeacherId === teacherId
  )
  const isSwap =
    Boolean(swapWith) && Boolean(course.homeroomTeacherId) && !sameAsCurrent

  // Solo un docente puede ser de aula de un curso a la vez. Mientras el docente actual siga
  // activo, una reasignación LLANA queda bloqueada aquí (no solo en el backend): el Director
  // primero le da de baja la cuenta en Usuarios y recién entonces puede reasignar. Un intercambio
  // no cae bajo esta regla: ahí se espera que ambos docentes sigan activos.
  const blockedByActiveTeacher =
    Boolean(course.homeroomTeacherId && course.homeroomTeacherActive) &&
    !sameAsCurrent &&
    !isSwap

  // Este curso no tiene encargado y el elegido sí tiene otro: no hay intercambio posible, porque
  // no hay a quién darle el curso que dejaría. Tomarlo igual lo haría encargado de dos a la vez, y
  // el backend lo rechaza. Decirlo acá y no dejar que el Director lo descubra apretando.
  const blockedByTeacherWithAnotherCourse =
    Boolean(swapWith) && !course.homeroomTeacherId

  const submit = async () => {
    if (!teacherId) return
    try {
      if (isSwap && swapWith) {
        await swapHomeroom.mutateAsync({
          courseAId: course.id,
          courseBId: swapWith.id,
        })
      } else {
        if (blockedByActiveTeacher || blockedByTeacherWithAnotherCourse) return
        await setHomeroom.mutateAsync({ id: course.id, teacherId })
      }
      onClose()
    } catch {
      /* toast via interceptor */
    }
  }

  const selectedTeacherName = (aulaTeachers.data ?? []).find(
    (t) => t.id === teacherId
  )?.fullName

  const isPending = setHomeroom.isPending || swapHomeroom.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>Docente de aula</DialogTitle>
        <DialogDescription>
          {`${course.gradeName} ${course.parallelName}`}
        </DialogDescription>
      </DialogHeader>

      {isSwap && swapWith ? (
        <p className="text-sm text-muted-foreground">
          Vas a intercambiar a <strong>{selectedTeacherName}</strong>{" "}
          (actualmente docente de aula de{" "}
          <strong>
            {swapWith.gradeName} {swapWith.parallelName}
          </strong>
          ) con <strong>{course.homeroomTeacherName}</strong> (docente de aula
          de{" "}
          <strong>
            {course.gradeName} {course.parallelName}
          </strong>
          ).
        </p>
      ) : blockedByTeacherWithAnotherCourse && swapWith ? (
        <p className="text-sm text-muted-foreground">
          <strong>{selectedTeacherName}</strong> ya es docente de aula de{" "}
          <strong>
            {swapWith.gradeName} {swapWith.parallelName}
          </strong>
          . Este curso no tiene a quién darle a cambio, así que no se puede
          intercambiar: elige un docente sin curso, o asigna primero un docente
          de aula a este curso.
        </p>
      ) : blockedByActiveTeacher ? (
        <p className="text-sm text-muted-foreground">
          <strong>{course.homeroomTeacherName}</strong> sigue activo como
          docente de aula de este curso. Para reasignarlo, primero dale de baja
          en Usuarios.
        </p>
      ) : null}

      <Field>
        <FieldLabel htmlFor="sh-teacher">Docente</FieldLabel>
        {/* También mientras cargan los cursos: sin ellos no se sabe si el docente elegido es de
            aula de otro curso, así que el diálogo mostraría el bloqueo y se corregiría solo un
            instante después. Elegir con el cartel equivocado delante es peor que esperar. */}
        <Select
          value={teacherId}
          onValueChange={setTeacherId}
          disabled={aulaTeachers.isLoading || allCourses.isLoading}
        >
          <SelectTrigger id="sh-teacher">
            <SelectValue placeholder="Selecciona docente de aula" />
          </SelectTrigger>
          <SelectContent>
            {/* No deshabilitamos aquí a los docentes que ya son de aula de otro curso: serlo
                en otro lado es justo lo que hace posible un intercambio. Una fase posterior sí
                los deshabilita, pero en el formulario de CREACIÓN de curso, no en este diálogo. */}
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
            !teacherId ||
            isPending ||
            blockedByActiveTeacher ||
            blockedByTeacherWithAnotherCourse
          }
          onClick={submit}
        >
          {isPending ? "Guardando…" : isSwap ? "Intercambiar" : "Asignar"}
        </Button>
      </DialogFooter>
    </>
  )
}
