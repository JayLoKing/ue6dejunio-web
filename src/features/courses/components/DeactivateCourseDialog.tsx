import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

import { useDeactivateCourse } from "../hooks/useCourses"
import type { Course } from "../types/course"

export interface DeactivateCourseDialogProps {
  course: Course | null
  onClose: () => void
}

/**
 * Confirma que se quite un curso. La API decide: sin estudiantes ni registros académicos lo elimina;
 * con alguno lo da de baja y conserva todo. El toast del hook dice cuál de las dos pasó.
 */
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
          ? `${course.gradeName} ${course.parallelName} (${course.year}): si el curso no tiene estudiantes inscritos ni registros académicos, se eliminará definitivamente. Si los tiene, se dará de baja y se conservará toda su información; podrás reactivarlo después.`
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
