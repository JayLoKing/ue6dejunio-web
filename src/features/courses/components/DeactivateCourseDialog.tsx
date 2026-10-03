import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

import { useDeactivateCourse } from "../hooks/useCourses"
import type { Course } from "../types/course"

export interface DeactivateCourseDialogProps {
  course: Course | null
  onClose: () => void
}

/** Confirma la baja de un curso. La API rechaza con 409 el que tiene estudiantes o registros. */
export function DeactivateCourseDialog({
  course,
  onClose,
}: DeactivateCourseDialogProps) {
  const deactivate = useDeactivateCourse()

  const confirm = async () => {
    if (!course) return
    try {
      await deactivate.mutateAsync(course.id)
      onClose()
    } catch {
      /* toast via interceptor: el diálogo sigue abierto con el motivo a la vista */
    }
  }

  return (
    <ConfirmDialog
      open={Boolean(course)}
      title="Dar de baja el curso"
      description={
        course
          ? `${course.gradeName} ${course.parallelName} (${course.year}) dejará de estar activo. Sólo se puede dar de baja un curso sin estudiantes inscritos ni registros académicos; después puedes reactivarlo.`
          : undefined
      }
      confirmLabel="Dar de baja"
      destructive
      loading={deactivate.isPending}
      onConfirm={confirm}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    />
  )
}
