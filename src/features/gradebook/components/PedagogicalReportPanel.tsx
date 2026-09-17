import { useState } from "react"
import { Loader2Icon, SaveIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"

import {
  usePedagogicalReport,
  useSavePedagogicalReport,
} from "../hooks/useGradebook"
import type {
  FailingStudentRow,
  GenderTally,
  PedagogicalReport,
  SavePedagogicalReportPayload,
} from "../types"

/** Una nota reprobada, como la imprime la planilla: sin decimales de más. */
const fmtMark = (mark: number): string =>
  mark.toLocaleString("es-BO", { maximumFractionDigits: 2 })

/** El porcentaje de la sección III. Sin nómina efectiva no hay porcentaje, y no es un cero. */
const fmtPct = (pct: number | null): string =>
  pct === null
    ? "—"
    : `${pct.toLocaleString("es-BO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} %`

/** Una caja vaciada es un null: la columna es nullable, y `""` guardaría una cadena en su lugar. */
const orNull = (text: string): string | null => {
  const trimmed = text.trim()
  return trimmed === "" ? null : trimmed
}

export interface PedagogicalReportPanelProps {
  courseId: string
}

/**
 * El informe pedagógico del curso, trimestre por trimestre.
 *
 * Cuatro secciones, de las que el docente escribe dos: la prosa de logros y dificultades, y las
 * acciones y la fuente de verificación de cada estudiante reprobado. El resto — el curso, los
 * conteos y quién reprobó qué — sale de las notas, y por eso no tiene dónde editarse acá.
 */
export function PedagogicalReportPanel({
  courseId,
}: PedagogicalReportPanelProps) {
  const [trimester, setTrimester] = useState(1)
  const report = usePedagogicalReport(courseId, trimester)
  const save = useSavePedagogicalReport()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Trimestre</span>
        <TrimesterSelect value={trimester} onChange={setTrimester} />
      </div>

      {report.isLoading ? (
        <div className="flex items-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando informe…
        </div>
      ) : report.isError || !report.data ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          No se pudo cargar el informe pedagógico de este trimestre.
        </div>
      ) : (
        <ReportSheet
          // La hoja que vuelve del guardado trae otro `updatedAt`, así que el formulario se rearma
          // sobre lo que el servidor guardó y no sobre lo que quedó tipeado.
          key={`${courseId}-${trimester}-${report.data.updatedAt ?? "nuevo"}`}
          sheet={report.data}
          saving={save.isPending}
          onSave={(payload) => save.mutate({ courseId, trimester, payload })}
        />
      )}
    </div>
  )
}

interface ReportSheetProps {
  sheet: PedagogicalReport
  saving: boolean
  onSave: (payload: SavePedagogicalReportPayload) => void
}

function ReportSheet({ sheet, saving, onSave }: ReportSheetProps) {
  const [achievements, setAchievements] = useState(sheet.achievements ?? "")
  const [difficulties, setDifficulties] = useState(sheet.difficulties ?? "")
  const [notes, setNotes] = useState(() => notesOf(sheet.failingStudents))

  const writeNote = (
    enrollmentId: string,
    field: "actions" | "verificationSource",
    value: string
  ) =>
    setNotes((prev) => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: value },
    }))

  // El formulario tiene las dos mitades a la vista, así que manda las dos. Omitir `failingStudents`
  // dejaría la sección IV intacta, que es justo lo que el docente acaba de editar acá.
  const submit = () =>
    onSave({
      achievements: orNull(achievements),
      difficulties: orNull(difficulties),
      failingStudents: sheet.failingStudents.map((s) => ({
        idCourseEnrollment: s.courseEnrollmentId,
        actions: orNull(notes[s.courseEnrollmentId]?.actions ?? ""),
        verificationSource: orNull(
          notes[s.courseEnrollmentId]?.verificationSource ?? ""
        ),
      })),
    })

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Heading sheet={sheet} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          II. Logros y dificultades del curso
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="informe-logros">Logros alcanzados</Label>
            <Textarea
              id="informe-logros"
              rows={6}
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="Qué logró el curso en el trimestre."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="informe-dificultades">
              Dificultades encontradas
            </Label>
            <Textarea
              id="informe-dificultades"
              rows={6}
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="Qué dificultades se presentaron."
            />
          </div>
        </div>
      </section>

      <StatsSection sheet={sheet} />

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-sm font-semibold">
          IV. Estudiantes reprobados y acciones
        </h2>
        {sheet.failingStudents.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ningún estudiante reprobó áreas en este trimestre.
          </p>
        ) : (
          <div className="min-w-0 overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="w-10 border-b px-3 py-2 text-left font-medium">
                    N.º
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Estudiante
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Áreas reprobadas
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Acciones, estrategias y/o adaptaciones curriculares
                  </th>
                  <th className="border-b px-3 py-2 text-left font-medium">
                    Fuente de verificación
                  </th>
                </tr>
              </thead>
              <tbody>
                {sheet.failingStudents.map((student) => (
                  <tr key={student.courseEnrollmentId} className="align-top">
                    <td className="border-b px-3 py-2">{student.number}</td>
                    <td className="border-b px-3 py-2 font-medium">
                      {student.fullName}
                    </td>
                    <td className="border-b px-3 py-2">
                      <ul className="flex flex-col gap-0.5">
                        {student.failedAreas.map((area) => (
                          <li key={area.classGroupId}>
                            {area.subjectName} — {fmtMark(area.mark)}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border-b px-3 py-2">
                      <Textarea
                        rows={3}
                        aria-label={`Acciones para ${student.fullName}`}
                        value={notes[student.courseEnrollmentId]?.actions ?? ""}
                        onChange={(e) =>
                          writeNote(
                            student.courseEnrollmentId,
                            "actions",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td className="border-b px-3 py-2">
                      <Textarea
                        rows={3}
                        aria-label={`Fuente de verificación para ${student.fullName}`}
                        value={
                          notes[student.courseEnrollmentId]
                            ?.verificationSource ?? ""
                        }
                        onChange={(e) =>
                          writeNote(
                            student.courseEnrollmentId,
                            "verificationSource",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>
          {saving ? (
            <>
              <Loader2Icon className="size-4 animate-spin" /> Guardando…
            </>
          ) : (
            <>
              <SaveIcon className="size-4" /> Guardar informe
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/** Lo escrito de cada estudiante, indexado por matrícula, listo para que el formulario lo edite. */
function notesOf(
  rows: FailingStudentRow[]
): Record<string, { actions: string; verificationSource: string }> {
  const byEnrollment: Record<
    string,
    { actions: string; verificationSource: string }
  > = {}
  for (const row of rows) {
    byEnrollment[row.courseEnrollmentId] = {
      actions: row.actions ?? "",
      verificationSource: row.verificationSource ?? "",
    }
  }
  return byEnrollment
}

/** Sección I. Datos referenciales: el encabezado de la escuela se imprime aparte. */
function Heading({ sheet }: { sheet: PedagogicalReport }) {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border bg-muted/30 px-4 py-3 text-sm">
      <span>
        <span className="text-muted-foreground">Curso: </span>
        <span className="font-medium">
          {sheet.gradeName} {sheet.parallelName}
        </span>
      </span>
      <span>
        <span className="text-muted-foreground">Gestión: </span>
        <span className="font-medium">{sheet.year}</span>
      </span>
      <span>
        <span className="text-muted-foreground">Docente: </span>
        <span className="font-medium">
          {sheet.homeroomTeacherName ?? "Sin docente de aula"}
        </span>
      </span>
      {sheet.exists ? (
        <Badge variant="secondary">Guardado</Badge>
      ) : (
        <Badge variant="outline">Sin guardar</Badge>
      )}
    </section>
  )
}

/**
 * Sección III. Los tres conteos no cierran entre sí y no deben forzarse: un estudiante que nadie
 * calificó es efectivo sin estar aprobado ni reprobado, y V + M puede quedar debajo de T porque
 * el género puede no estar registrado.
 */
function StatsSection({ sheet }: { sheet: PedagogicalReport }) {
  const rows: Array<[string, GenderTally]> = [
    ["Efectivos", sheet.stats.effective],
    ["Aprobados", sheet.stats.passed],
    ["Reprobados", sheet.stats.failed],
  ]

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-sm font-semibold">III. Estadística del curso</h2>
      <div className="min-w-0 overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border-b px-3 py-2 text-left font-medium"> </th>
              <th className="border-b px-3 py-2 text-right font-medium">V</th>
              <th className="border-b px-3 py-2 text-right font-medium">M</th>
              <th className="border-b px-3 py-2 text-right font-medium">T</th>
              <th className="border-b px-3 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, tally]) => (
              <tr key={label}>
                <td className="border-b px-3 py-2">{label}</td>
                <td className="border-b px-3 py-2 text-right">{tally.male}</td>
                <td className="border-b px-3 py-2 text-right">
                  {tally.female}
                </td>
                <td className="border-b px-3 py-2 text-right">{tally.total}</td>
                <td className="border-b px-3 py-2 text-right">
                  {fmtPct(tally.percentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
