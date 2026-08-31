import type { NotificationItem, NotificationType } from "../types"

/**
 * What a notification is about, in one line, for the reader.
 *
 * <p>Exported because the compose form offers these same words as the reasons to write: the
 * heading a receiver reads has to be the one the sender picked, and two lists cannot promise that.
 */
export const HEADING: Record<NotificationType, string> = {
  PDC_PUBLISHED: "PDC entregado",
  PDC_APPROVED: "PDC aprobado",
  PDC_OBSERVED: "PDC observado",
  NOTEBOOK: "Cuaderno pedagógico",
  ATTENDANCE: "Asistencias",
  PDC_PROGRESS: "Avance del PDC",
  SUMMONS: "Citación a dirección",
  // Never read: a custom notification is headed by the subject its sender typed.
  CUSTOM: "Aviso",
}

/** What is shown when there is nothing else to show it as. */
const UNTITLED = "Aviso"

/**
 * The line an inbox row is headed with.
 *
 * <p>The catalog types are their own subject — which is why the API refuses to store a second one
 * beside them — so the words live here and only here. Only a custom notification carries a subject
 * of its own, and it wins because it is the whole reason that field exists.
 *
 * <p>Falls back rather than printing an enum name: a type this build does not know is a server
 * that moved ahead of the browser, and a reader should see a notice, not `PDC_SOMETHING`.
 */
export function headingOf(notification: NotificationItem): string {
  const typed = notification.subject?.trim()
  if (notification.type === "CUSTOM") {
    return typed ? typed : UNTITLED
  }
  // Read as a plain string on purpose: the union promises every type has a heading, but the type
  // itself arrives from the server, so the miss the fallback answers is one TypeScript cannot see.
  return (
    (HEADING as Record<string, string | undefined>)[notification.type] ??
    UNTITLED
  )
}
