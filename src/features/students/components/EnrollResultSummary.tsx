import { useId, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { EnrollResponse } from "../models/response/enroll-response"

export interface EnrollResultSummaryProps {
  result: EnrollResponse
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  )
}

/**
 * Un grupo de estudiantes nombrados uno por uno. Los omitidos van en ámbar porque piden que alguien
 * haga algo; los reincorporados no, porque ya quedaron inscritos.
 */
function StudentGroup({
  title,
  omitted,
  children,
}: {
  title: string
  omitted: boolean
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3 text-sm",
        omitted && "border-amber-500/40 bg-amber-500/10"
      )}
    >
      <p id={titleId} className="font-medium">
        {title}
      </p>
      <ul className="list-disc pl-5">{children}</ul>
    </section>
  )
}

/**
 * Lo que dejó una carga: de dónde vino cada estudiante y a quién se omitió.
 *
 * Los omitidos se listan por nombre y no sólo se cuentan: nadie los inscribió, y quien cargó la
 * nómina necesita saber a quién buscar. Un retirado de esta gestión se lo pide al Director; uno ya
 * inscrito en otro curso, a quien lleva ese curso; una fila en conflicto, a quien corrija los datos.
 */
export function EnrollResultSummary({ result }: EnrollResultSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Figure label="Nuevos" value={result.studentsCreated} />
        <Figure
          label="De la gestión anterior"
          value={result.studentsFromPreviousYear}
        />
        <Figure label="Reingresos" value={result.studentsReentering} />
      </div>
      <p className="text-sm text-muted-foreground">
        {result.enrollmentsCreated} inscripciones generadas.
      </p>

      {result.reinstated.length > 0 ? (
        <StudentGroup
          title="Reincorporados de una gestión anterior"
          omitted={false}
        >
          {result.reinstated.map((s) => (
            <li key={s.studentId}>{s.fullName}</li>
          ))}
        </StudentGroup>
      ) : null}

      {result.skippedWithdrawn.length > 0 ? (
        <StudentGroup
          title="Retirados omitidos — solo el Director puede reincorporarlos"
          omitted
        >
          {result.skippedWithdrawn.map((s) => (
            <li key={s.studentId}>{s.fullName}</li>
          ))}
        </StudentGroup>
      ) : null}

      {result.skippedOtherCourse.length > 0 ? (
        <StudentGroup
          title="Ya inscritos en otro curso de esta gestión"
          omitted
        >
          {result.skippedOtherCourse.map((s) => (
            <li key={s.studentId}>
              {s.fullName} — {s.courseLabel}
            </li>
          ))}
        </StudentGroup>
      ) : null}

      {result.conflicts.length > 0 ? (
        <StudentGroup
          title="Datos en conflicto (RUDE y CI de estudiantes distintos)"
          omitted
        >
          {result.conflicts.map((c) => (
            <li key={`${c.rudeCode}-${c.identityCard}`}>
              {c.fullName} (RUDE {c.rudeCode}, CI {c.identityCard}): {c.reason}
            </li>
          ))}
        </StudentGroup>
      ) : null}
    </div>
  )
}
