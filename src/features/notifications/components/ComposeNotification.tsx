import { useState } from "react"
import { SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  NotificationType,
  Recipient,
  SendNotificationPayload,
} from "../types"

/**
 * The reasons the school writes to someone, in the order a Director is likely to reach for them.
 *
 * <p>Only the ones a person may send: the three PDC types are written by the plan changing, and
 * the API refuses them from a person for the same reason this list leaves them out — a notice
 * saying a plan was approved has to mean that it was.
 */
const REASONS: { type: NotificationType; label: string }[] = [
  { type: "SUMMONS", label: "Citación a dirección" },
  { type: "NOTEBOOK", label: "Cuaderno pedagógico" },
  { type: "ATTENDANCE", label: "Asistencias" },
  { type: "PDC_PROGRESS", label: "Avance del PDC" },
  { type: "CUSTOM", label: "Otro" },
]

export interface ComposeNotificationProps {
  recipients: Recipient[]
  sending: boolean
  onSend: (payload: SendNotificationPayload) => void
}

/**
 * Where the Director writes to a teacher or the secretary.
 *
 * <p>Presentational: it holds what is being typed and hands back a payload. Who may receive is
 * decided by whoever fills `recipients`, and enforced again by the API — this form only
 * makes sure it does not offer a name the server would refuse.
 */
export function ComposeNotification({
  recipients,
  sending,
  onSend,
}: ComposeNotificationProps) {
  const [receiverId, setReceiverId] = useState("")
  const [type, setType] = useState<NotificationType>("SUMMONS")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const needsSubject = type === "CUSTOM"
  const typedSubject = subject.trim()
  // Everything the API would refuse, refused here first: a 400 for a form the sender can see is
  // incomplete tells them nothing they did not already know.
  const ready =
    receiverId !== "" &&
    message.trim() !== "" &&
    (!needsSubject || typedSubject !== "")

  const send = () => {
    if (!ready) return
    onSend({
      receiver_id: receiverId,
      type,
      // Absent unless it is the one type that carries one, because the API refuses a catalog
      // type arriving with a subject beside it.
      ...(needsSubject ? { subject: typedSubject } : {}),
      message: message.trim(),
    })
    setReceiverId("")
    setType("SUMMONS")
    setSubject("")
    setMessage("")
  }

  if (recipients.length === 0) {
    return (
      <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        No hay docentes ni secretaria activos a quienes escribir.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4">
      <Field>
        <FieldLabel htmlFor="notification-receiver">Destinatario</FieldLabel>
        <Select value={receiverId} onValueChange={setReceiverId}>
          <SelectTrigger id="notification-receiver">
            <SelectValue placeholder="Selecciona a quién escribir" />
          </SelectTrigger>
          <SelectContent>
            {recipients.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="notification-type">Motivo</FieldLabel>
        <Select
          value={type}
          onValueChange={(next) => setType(next as NotificationType)}
        >
          <SelectTrigger id="notification-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.type} value={r.type}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          El motivo es el título con el que el destinatario ve el aviso. Con
          «Otro» lo escribes tú.
        </FieldDescription>
      </Field>

      {needsSubject ? (
        <Field>
          <FieldLabel htmlFor="notification-subject">Asunto</FieldLabel>
          <Textarea
            id="notification-subject"
            rows={1}
            maxLength={150}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="notification-message">Mensaje</FieldLabel>
        <Textarea
          id="notification-message"
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>

      <div className="flex justify-end">
        <Button
          type="button"
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={!ready || sending}
          onClick={send}
        >
          <SendIcon className="size-4" />
          {sending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
