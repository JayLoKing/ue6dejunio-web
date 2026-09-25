import { useState } from "react"
import { FileDownIcon, Loader2Icon, PrinterIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { printElementById } from "@/lib/printDocument"
import { saveBlob } from "@/lib/saveBlob"
import type { Institution } from "@/features/institution/types"
import { useInstitution } from "@/features/institution/hooks/useInstitution"

import {
  usePedagogicalReport,
  useSavePedagogicalReport,
} from "../hooks/useGradebook"
import {
  PEDAGOGICAL_REPORT_DOCUMENT_ID,
  PedagogicalReportPreview,
} from "./PedagogicalReportPreview"
import type {
  FailingStudentRow,
  PedagogicalReport,
  SavePedagogicalReportPayload,
} from "../types"
import { fmtMark, pedagogicalReportLabel } from "../utils/pedagogicalReport"
import { printablePedagogicalReportOf } from "../utils/pedagogicalReportDocument"

/** Una caja vaciada es un null: la columna es nullable, y `""` guardaría una cadena en su lugar. */
const orNull = (text: string): string | null => {
  const trimmed = text.trim()
  return trimmed === "" ? null : trimmed
}

/**
 * El informe como archivo de Word.
 *
 * Se escribe desde el informe y no desde el marcado de la pantalla, así lo que abre Word no depende
 * de una hoja de estilos que nunca viajó con el archivo. La librería se carga recién cuando alguien
 * pide el archivo: escribe documentos, y no tiene nada que hacer en el bundle que descarga todo el
 * mundo para ver un listado.
 */
async function downloadReportAsDocx(
  sheet: PedagogicalReport,
  school: Institution
) {
  const [{ pedagogicalReportDocxOf }, { Packer }] = await Promise.all([
    import("../utils/pedagogicalReportDocx"),
    import("docx"),
  ])
  const blob = await Packer.toBlob(pedagogicalReportDocxOf({ sheet, school }))
  saveBlob(blob, `${pedagogicalReportLabel(sheet)}.docx`)
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
 *
 * Debajo del formulario va la hoja tal como se entrega, y se rehace con cada tecla: lo que el
 * docente revisa antes de imprimir es el documento, no un resumen de lo que tipeó.
 */
export function PedagogicalReportPanel({
  courseId,
}: PedagogicalReportPanelProps) {
  const [trimester, setTrimester] = useState(1)
  const report = usePedagogicalReport(courseId, trimester)
  const save = useSavePedagogicalReport()
  const { data: school } = useInstitution()

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
          school={school}
          saving={save.isPending}
          onSave={(payload) => save.mutate({ courseId, trimester, payload })}
        />
      )}
    </div>
  )
}

interface ReportSheetProps {
  sheet: PedagogicalReport
  /** El encabezado de la escuela. Ausente mientras se lo está pidiendo. */
  school?: Institution
  saving: boolean
  onSave: (payload: SavePedagogicalReportPayload) => void
}

function ReportSheet({ sheet, school, saving, onSave }: ReportSheetProps) {
  const [achievements, setAchievements] = useState(sheet.achievements ?? "")
  const [difficulties, setDifficulties] = useState(sheet.difficulties ?? "")
  const [notes, setNotes] = useState(() => notesOf(sheet.failingStudents))
  const [writing, setWriting] = useState(false)

  const writeNote = (
    enrollmentId: string,
    field: "actions" | "verificationSource",
    value: string
  ) =>
    setNotes((prev) => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: value },
    }))

  /*
   * El informe con lo que hay tipeado encima. De acá salen las dos cosas que tienen que coincidir:
   * la hoja que el docente mira y el PUT que manda. Derivarlas de la misma copia es lo que impide
   * que imprima una versión y guarde otra.
   */
  const live: PedagogicalReport = {
    ...sheet,
    achievements: orNull(achievements),
    difficulties: orNull(difficulties),
    failingStudents: sheet.failingStudents.map((student) => ({
      ...student,
      actions: orNull(notes[student.courseEnrollmentId]?.actions ?? ""),
      verificationSource: orNull(
        notes[student.courseEnrollmentId]?.verificationSource ?? ""
      ),
    })),
  }

  // El formulario tiene las dos mitades a la vista, así que manda las dos. Omitir `failingStudents`
  // dejaría la sección IV intacta, que es justo lo que el docente acaba de editar acá.
  const submit = () =>
    onSave({
      achievements: live.achievements,
      difficulties: live.difficulties,
      failingStudents: live.failingStudents.map((student) => ({
        idCourseEnrollment: student.courseEnrollmentId,
        actions: student.actions,
        verificationSource: student.verificationSource,
      })),
    })

  const print = () =>
    printElementById(
      PEDAGOGICAL_REPORT_DOCUMENT_ID,
      pedagogicalReportLabel(live),
      printablePedagogicalReportOf
    )

  const download = () => {
    if (!school) return
    setWriting(true)
    downloadReportAsDocx(live, school)
      .catch(() => toast.error("No se pudo generar el documento de Word."))
      .finally(() => setWriting(false))
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span>
            <span className="text-muted-foreground">Curso: </span>
            <span className="font-medium">
              {sheet.gradeName} {sheet.parallelName}
            </span>
          </span>
          {sheet.exists ? (
            <Badge variant="secondary">Guardado</Badge>
          ) : (
            <Badge variant="outline">Sin guardar</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={download}
            disabled={!school || writing}
            title={
              school
                ? undefined
                : "Falta el encabezado de la unidad educativa para exportar"
            }
          >
            {writing ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <FileDownIcon className="size-4" />
            )}
            Descargar Word
          </Button>
          <Button
            variant="outline"
            onClick={print}
            disabled={!school}
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
      </div>

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
            <table
              aria-label="Acciones por estudiante"
              className="w-full border-collapse text-sm"
            >
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

      <section className="flex min-w-0 flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Vista previa
        </p>
        {/*
          El encabezado institucional es parte del documento, no un adorno: sin él la hoja saldría
          con la sección I a medias. El formulario se escribe igual mientras tanto.
        */}
        {!school ? (
          <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
            Cargando el encabezado de la unidad educativa…
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto rounded-md border bg-muted/30 p-4">
            <PedagogicalReportPreview sheet={live} school={school} />
          </div>
        )}
      </section>
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
