import type { PdcStatus } from "../types"

/** What a status is called on screen. The API answers in English; the teacher reads Spanish. */
export const STATUS_LABEL: Record<PdcStatus, string> = {
  Draft: "Borrador",
  Published: "Publicado",
  "Under Review": "En revisión",
  "With Observations": "Con observaciones",
  Approved: "Aprobado",
}

/**
 * Whether a plan can still be written. A published plan is in the Director's hands until they
 * approve it or send it back with observations.
 */
export function isEditable(status: PdcStatus): boolean {
  return status === "Draft" || status === "With Observations"
}

/** How a status is shaded in the listing: draft muted, review amber, observations alarming. */
export const STATUS_BADGE: Record<PdcStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Published:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
  "Under Review":
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  "With Observations":
    "bg-destructive/15 text-destructive border border-destructive/30",
  Approved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
}
