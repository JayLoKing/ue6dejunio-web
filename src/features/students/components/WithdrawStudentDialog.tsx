import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"

import { useWithdrawStudent } from "../hooks/useStudentDirectory"
import {
  REASON_NEEDS_NOTE,
  WITHDRAWAL_REASONS,
  type WithdrawalReason,
} from "../types"

/** A quién se está por dar de baja. */
export interface WithdrawalTarget {
  id: string
  fullName: string
}

export interface WithdrawStudentDialogProps {
  /** Null cierra el diálogo. */
  student: WithdrawalTarget | null
  onClose: () => void
}

/**
 * Dar de baja a un estudiante.
 *
 * El formulario se monta con `key` por estudiante en vez de limpiarse en un efecto: heredar el
 * motivo del anterior es la forma más fácil de dar de baja a alguien por una razón que no es la
 * suya, y remontar lo resuelve sin un efecto que corrija el estado después de pintarlo.
 */
export function WithdrawStudentDialog({
  student,
  onClose,
}: WithdrawStudentDialogProps) {
  return (
    <Dialog open={Boolean(student)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dar de baja</DialogTitle>
          <DialogDescription>
            {student?.fullName} deja el padrón y sus inscripciones activas se
            cierran. La ficha y sus notas quedan.
          </DialogDescription>
        </DialogHeader>

        {student ? (
          <WithdrawalForm
            key={student.id}
            student={student}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/**
 * El motivo y la nota.
 *
 * La nota es obligatoria cuando el motivo es "Otro", y se dice acá antes de mandar: el backend
 * también lo rechaza, pero contestarlo con un 400 obliga a la persona a descubrir la regla
 * chocándose con ella.
 */
function WithdrawalForm({
  student,
  onClose,
}: {
  student: WithdrawalTarget
  onClose: () => void
}) {
  const [reason, setReason] = useState<WithdrawalReason>(WITHDRAWAL_REASONS[0])
  const [note, setNote] = useState("")
  const withdraw = useWithdrawStudent()

  const trimmedNote = note.trim()
  const noteMissing = reason === REASON_NEEDS_NOTE && trimmedNote === ""

  const submit = () => {
    if (noteMissing) return
    withdraw.mutate(
      {
        id: student.id,
        payload: { reason, ...(trimmedNote ? { note: trimmedNote } : {}) },
      },
      { onSuccess: onClose }
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="withdraw-reason">Motivo</Label>
          <Select
            value={reason}
            onValueChange={(v) => setReason(v as WithdrawalReason)}
          >
            <SelectTrigger id="withdraw-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WITHDRAWAL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="withdraw-note">
            Nota{reason === REASON_NEEDS_NOTE ? "" : " (opcional)"}
          </Label>
          <Textarea
            id="withdraw-note"
            rows={3}
            placeholder="En qué quedó, en tus palabras."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {noteMissing ? (
            <p className="text-xs text-destructive">
              Una baja por otro motivo exige decir cuál es.
            </p>
          ) : null}
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={withdraw.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={submit}
          disabled={noteMissing || withdraw.isPending}
        >
          {withdraw.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Dar de baja
        </Button>
      </DialogFooter>
    </>
  )
}
