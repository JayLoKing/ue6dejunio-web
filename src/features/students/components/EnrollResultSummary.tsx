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
 * Lo que dejó una carga: de dónde vino cada estudiante y a quién se omitió.
 *
 * Los retirados se listan por nombre y no sólo se cuentan: nadie los inscribió, y quien cargó la
 * nómina necesita saber a quién buscar para pedirle al Director que lo reincorpore.
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

      {result.skippedWithdrawn.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium">
            Retirados omitidos — solo el Director puede reincorporarlos
          </p>
          <ul className="list-disc pl-5">
            {result.skippedWithdrawn.map((s) => (
              <li key={s.studentId}>{s.fullName}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
