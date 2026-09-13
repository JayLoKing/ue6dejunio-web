import { useMemo, useState } from "react"
import { Loader2Icon, PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { printElementById } from "@/lib/printDocument"
import { useInstitution } from "@/features/institution/hooks/useInstitution"

import { useAnnualCentralizer, useReportCard } from "../hooks/useGradebook"
import {
  REPORT_CARD_DOCUMENT_ID,
  ReportCardPreview,
} from "./ReportCardPreview"
import { printableReportCardOf } from "../utils/reportCardDocument"

export interface ReportCardPanelProps {
  courseId: string
}

/**
 * Las libretas del curso: se elige un estudiante, se ve su hoja y se imprime.
 *
 * El listado sale del centralizador anual, que ya trae el curso entero con su promedio final. Es
 * la misma consulta que alimenta la pestaña de cierre, así que elegir un estudiante acá después de
 * haber mirado los promedios no vuelve a pedir nada.
 */
export function ReportCardPanel({ courseId }: ReportCardPanelProps) {
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)

  const rosterQuery = useMemo(
    () => ({ offset: 1, limit: 200, sort: "asc" as const }),
    []
  )
  const { data: roster, isLoading: loadingRoster } = useAnnualCentralizer(
    courseId,
    rosterQuery
  )
  const { data: card, isLoading: loadingCard } = useReportCard(enrollmentId)
  const { data: school } = useInstitution()

  const students = roster?.content ?? []

  const print = () => {
    if (!card) return
    printElementById(
      REPORT_CARD_DOCUMENT_ID,
      `Libreta ${card.fullName} ${card.year}`,
      printableReportCardOf
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estudiante</span>
          <Select
            value={enrollmentId ?? ""}
            onValueChange={setEnrollmentId}
            disabled={loadingRoster || students.length === 0}
          >
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Selecciona un estudiante" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem
                  key={s.courseEnrollmentId}
                  value={s.courseEnrollmentId}
                >
                  {s.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={print}
          disabled={!card || !school}
          title={
            school
              ? undefined
              : "Falta el encabezado de la unidad educativa para imprimir"
          }
        >
          <PrinterIcon className="size-4" />
          Imprimir
        </Button>
      </div>

      {!enrollmentId ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          Selecciona un estudiante para ver su libreta.
        </div>
      ) : loadingCard || !card || !school ? (
        <div className="flex items-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando libreta…
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border bg-muted/30 p-4">
          <ReportCardPreview card={card} school={school} />
        </div>
      )}
    </div>
  )
}
