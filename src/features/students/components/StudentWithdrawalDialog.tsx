import { Loader2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { StudentWithdrawalPanel } from "./StudentWithdrawalPanel"
import { useStudentDetail } from "../hooks/useStudent"

export interface StudentWithdrawalDialogProps {
  /** El estudiante que se está consultando. Null cierra el diálogo. */
  studentId: string | null
  onClose: () => void
}

/**
 * El motivo de la baja, para el docente que ve a un estudiante desaparecer de su lista.
 *
 * Pide la ficha acá y no en el padrón: el listado muestra el estado, no la explicación, y traer el
 * motivo de cada fila sería cargar en cada consulta algo que casi nadie va a abrir.
 */
export function StudentWithdrawalDialog({
  studentId,
  onClose,
}: StudentWithdrawalDialogProps) {
  const detail = useStudentDetail(studentId)

  return (
    <Dialog open={Boolean(studentId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Baja del estudiante</DialogTitle>
        </DialogHeader>

        {detail.isLoading || !detail.data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" /> Cargando la ficha…
          </div>
        ) : (
          <StudentWithdrawalPanel student={detail.data} />
        )}
      </DialogContent>
    </Dialog>
  )
}
