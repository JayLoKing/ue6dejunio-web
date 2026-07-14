import { useEffect, useState } from "react"

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
  const aulaTeachers = useTeachers(false)
  const setHomeroom = useSetHomeroom()
  const [teacherId, setTeacherId] = useState<string | undefined>()

  useEffect(() => {
    setTeacherId(course?.homeroomTeacherId ?? undefined)
  }, [course])

  const submit = async () => {
    if (!course || !teacherId) return
    try {
      await setHomeroom.mutateAsync({ id: course.id, teacherId })
      onClose()
    } catch {
      /* toast via interceptor */
    }
  }

  return (
    <Dialog open={Boolean(course)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Docente de aula</DialogTitle>
          <DialogDescription>
            {course ? `${course.gradeName} ${course.parallelName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="sh-teacher">Docente</FieldLabel>
          <Select
            value={teacherId}
            onValueChange={setTeacherId}
            disabled={aulaTeachers.isLoading}
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
            className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
            disabled={!teacherId || setHomeroom.isPending}
            onClick={submit}
          >
            {setHomeroom.isPending ? "Guardando…" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
