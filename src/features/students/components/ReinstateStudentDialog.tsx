import { useState } from "react"
import { isAxiosError } from "axios"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useActiveYearCourses } from "@/features/courses/hooks/useActiveYearCourses"

import { useReinstateStudent } from "../hooks/useStudentDirectory"

/** A quién se está por reincorporar. */
export interface ReinstateTarget {
  id: string
  fullName: string
}

export interface ReinstateStudentDialogProps {
  /** Null cierra el diálogo. */
  student: ReinstateTarget | null
  onClose: () => void
}

/**
 * Reincorporar a un retirado. Sólo Dirección: quien lo llama decide si ofrecerlo.
 *
 * El formulario se monta con `key` por estudiante, por la misma razón que el de la baja: que el
 * curso elegido para uno no quede puesto al abrir el siguiente.
 */
export function ReinstateStudentDialog({
  student,
  onClose,
}: ReinstateStudentDialogProps) {
  return (
    <Dialog open={Boolean(student)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reincorporar estudiante</DialogTitle>
          <DialogDescription>
            {student?.fullName} vuelve al padrón. Si tenía un curso en la
            gestión activa, se reabre; si no, se te pedirá elegir uno.
          </DialogDescription>
        </DialogHeader>

        {student ? (
          <ReinstateForm key={student.id} student={student} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Sólo el 400 significa "falta el curso". Un 409 (no está retirado, gestión cerrada) no se arregla
 * eligiendo un curso, y pedirlo mandaría a la persona a reintentar algo que no va a funcionar.
 */
const asksForCourse = (e: unknown): boolean =>
  isAxiosError(e) && e.response?.status === 400

function ReinstateForm({
  student,
  onClose,
}: {
  student: ReinstateTarget
  onClose: () => void
}) {
  const reinstate = useReinstateStudent()
  // Se pide el curso recién cuando la API lo reclama: lo normal es que haya una matrícula
  // retirada que reabrir, y preguntar de entrada por un dato que casi nunca hace falta sobra.
  const [needsCourse, setNeedsCourse] = useState(false)
  const [courseId, setCourseId] = useState("")

  const submit = async () => {
    try {
      await reinstate.mutateAsync(
        needsCourse ? { id: student.id, courseId } : { id: student.id }
      )
      onClose()
    } catch (e) {
      // El interceptor ya mostró el mensaje de la API.
      if (!needsCourse && asksForCourse(e)) setNeedsCourse(true)
    }
  }

  return (
    <>
      {needsCourse ? (
        <ActiveYearCoursePicker value={courseId} onChange={setCourseId} />
      ) : null}

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={reinstate.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={reinstate.isPending || (needsCourse && courseId === "")}
        >
          {reinstate.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Reincorporar
        </Button>
      </DialogFooter>
    </>
  )
}

/**
 * Los cursos de la gestión activa. Se monta recién cuando hace falta, para no pedir la lista de
 * cursos cada vez que alguien abre el diálogo y la reincorporación se resuelve sin ella.
 */
function ActiveYearCoursePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const courses = useActiveYearCourses()
  const list = courses.data?.content ?? []

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-muted-foreground">
        No tiene una matrícula retirada en la gestión activa. Elige el curso en
        el que se reincorpora.
      </p>
      <Label htmlFor="reinstate-course">Curso</Label>
      {courses.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando cursos...</p>
      ) : courses.isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los cursos.
        </p>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="reinstate-course">
            <SelectValue placeholder="Elige un curso" />
          </SelectTrigger>
          <SelectContent>
            {list.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.gradeName} {c.parallelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
