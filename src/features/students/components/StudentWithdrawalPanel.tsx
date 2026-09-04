import type { StudentDetail } from "../types"

/** El estado que el backend escribe cuando se da de baja a un estudiante. */
const WITHDRAWN = "Withdrawn"

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm whitespace-pre-wrap">{children}</span>
    </div>
  )
}

export interface StudentWithdrawalPanelProps {
  student: StudentDetail
}

/**
 * Por qué un estudiante ya no está en el curso.
 *
 * Sólo lectura, y sin un solo control: la baja es una decisión que toma la Dirección, y el docente
 * lee lo que se decidió. Un botón acá prometería algo que la API le va a negar.
 *
 * Componente aparte del diálogo que lo abre porque lo que hay que probar es esto —
 * qué se muestra y qué no — y eso se prueba sin red.
 */
export function StudentWithdrawalPanel({
  student,
}: StudentWithdrawalPanelProps) {
  const fullName = `${student.names} ${student.lastNames}`

  if (student.status !== WITHDRAWN) {
    return (
      <p className="text-sm text-muted-foreground">
        {fullName} no fue dado de baja.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <span className="font-medium">{fullName}</span> fue dado de baja del
        curso.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Motivo">{student.statusReason ?? "Sin registro"}</Field>
        <Field label="Dado de baja por">
          {/* Sin autor cuando la cuenta que decidió ya no existe: la columna es ON DELETE SET
              NULL, así que el hecho sobrevive a quien lo hizo. */}
          {student.statusChangedByName ?? "Sin registro"}
        </Field>
        <Field label="Fecha">
          {student.statusChangedAt
            ? formatWhen(student.statusChangedAt)
            : "Sin registro"}
        </Field>
      </div>

      {/* Sólo cuando hay algo escrito: un rótulo con la celda vacía debajo no informa nada. */}
      {student.statusNote ? (
        <Field label="Detalle">{student.statusNote}</Field>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Esta información es sólo de consulta. Las bajas las registra la
        Dirección.
      </p>
    </div>
  )
}
