import { useState } from "react"
import { FileTextIcon, Loader2Icon, UploadCloudIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useCourseOverview } from "@/features/courses/hooks/useCourses"

import {
  ENROLL_FILE_ACCEPT,
  useParseEnrollFile,
} from "../hooks/useParseEnrollFile"
import { useEnrollBatch } from "../hooks/useEnroll"
import type { EnrollResponse } from "../models/response/enroll-response"
import type {
  ParsedEnrollFile,
  ParsedStudentRow,
  RejectedNominaRow,
  StudentPayload,
} from "../types"
import { nominaBlockFor } from "../utils/nominaXlsx"
import {
  rosterHeaderMismatch,
  type RosterTargetCourse,
} from "../utils/rosterHeader"
import { schoolRosterBlockFor } from "../utils/sieSchoolRoster"
import { EnrollResultSummary } from "./EnrollResultSummary"

export interface AutomatedEnrollFormProps {
  courseId: string | null
  onSuccess: () => void
}

/** Lo que se muestra donde la planilla no trae el dato. */
const EMPTY_CELL = "—"

/** Lo que el archivo deja inscribir en el curso destino, o por qué no deja. */
interface EnrollableRows {
  rows: ParsedStudentRow[]
  rejected: RejectedNominaRow[]
  error: string | null
}

const NOTHING: EnrollableRows = { rows: [], rejected: [], error: null }

/**
 * Las filas del archivo que corresponden al curso destino.
 *
 * El PDF del SIE de un curso tiene que nombrar el destino en su cabecera. El PDF del SIE de toda la
 * unidad y la planilla de la escuela traen todos los cursos, y se toma sólo el bloque del destino.
 * Sin el curso cargado el PDF de un curso se muestra (el botón sigue deshabilitado), pero de los
 * otros dos no hay bloque que elegir todavía.
 */
const enrollableRows = (
  parsed: ParsedEnrollFile | null,
  course: RosterTargetCourse | undefined
): EnrollableRows => {
  if (!parsed) return NOTHING
  if (parsed.kind === "pdf") {
    if (!course) return { rows: parsed.roster.rows, rejected: [], error: null }
    const error = rosterHeaderMismatch(parsed.roster.header, course)
    return error
      ? { ...NOTHING, error }
      : { rows: parsed.roster.rows, rejected: [], error: null }
  }
  if (parsed.kind === "pdf-school") {
    if (!course) return NOTHING
    const picked = schoolRosterBlockFor(parsed.roster, course)
    return "error" in picked
      ? { ...NOTHING, error: picked.error }
      : { rows: picked.block.rows, rejected: [], error: null }
  }
  if (!course) return NOTHING
  const picked = nominaBlockFor(parsed.blocks, course)
  if ("error" in picked) return { ...NOTHING, error: picked.error }
  const { rows, rejected, grade, parallel } = picked.block
  return {
    rows,
    rejected,
    error:
      rows.length === 0
        ? `El curso ${grade} ${parallel} de la planilla no trae estudiantes.`
        : null,
  }
}

/** La fila como la recibe la API: un dato que no trae se omite, y la API lo toma como vacío. */
const toPayload = ({
  rudeCode,
  identityCard,
  names,
  lastNames,
  birthDate,
  gender,
}: ParsedStudentRow): StudentPayload => ({
  names,
  lastNames,
  ...(rudeCode ? { rudeCode } : {}),
  ...(identityCard ? { identityCard } : {}),
  ...(birthDate ? { birthDate } : {}),
  ...(gender ? { gender } : {}),
})

export function AutomatedEnrollForm({
  courseId,
  onSuccess,
}: AutomatedEnrollFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedEnrollFile | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<EnrollResponse | null>(null)

  const parse = useParseEnrollFile()
  const parsing = parse.isPending
  const enroll = useEnrollBatch()
  // El mismo overview que ya pide el menú lateral: comparte su caché y no agrega un endpoint.
  const course = useCourseOverview(courseId, 1).data?.course

  const { rows, rejected, error: courseError } = enrollableRows(parsed, course)
  const errorMessage = parseError ?? courseError
  const fromXlsx = parsed?.kind === "xlsx"

  const handleFile = async (selected: File | null) => {
    setFile(selected)
    setParsed(null)
    setParseError(null)
    if (!selected) return
    try {
      const read = await parse.mutateAsync(selected)
      if (read.kind === "pdf" && read.roster.rows.length === 0) {
        setParseError(
          "No se detectaron filas válidas. Verifica el formato del PDF."
        )
      }
      setParsed(read)
    } catch (e) {
      setParseError(
        e instanceof Error ? e.message : "Error al procesar el archivo."
      )
    }
  }

  const handleSubmit = async () => {
    if (!courseId || !course || courseError || rows.length === 0) return
    try {
      const response = await enroll.mutateAsync({
        id_course: courseId,
        students: rows.map(toPayload),
      })
      // No se cierra solo: el resumen dice a quién se omitió, y cerrar lo taparía.
      setResult(response)
    } catch {
      /* toast via interceptor */
    }
  }

  const maleCount = rows.filter((r) => r.gender === "M").length
  const femaleCount = rows.filter((r) => r.gender === "F").length

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <EnrollResultSummary result={result} />
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onSuccess}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="pdf-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand/30 bg-brand/5 p-6 text-sm hover:border-brand/60"
      >
        <UploadCloudIcon className="size-8 text-brand" />
        <span className="font-medium">
          {file ? file.name : "Subir nómina PDF o Excel"}
        </span>
        <span className="text-xs text-muted-foreground">
          PDF del SIE (de tu curso o de toda la unidad) o la planilla de la
          escuela (.xlsx)
        </span>
        <input
          id="pdf-upload"
          type="file"
          accept={ENROLL_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={parsing || enroll.isPending}
        />
      </label>

      {parsing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Procesando archivo...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="flex items-center gap-3 text-sm">
            <FileTextIcon className="size-4 text-brand" />
            <span className="font-medium">{rows.length} estudiantes</span>
            {fromXlsx ? null : (
              <>
                <Badge variant="secondary">{maleCount} niños</Badge>
                <Badge variant="secondary">{femaleCount} niñas</Badge>
              </>
            )}
          </div>

          {fromXlsx ? (
            <p className="text-sm text-muted-foreground">
              La planilla trae sólo los nombres. RUDE, carnet, fecha de
              nacimiento y género quedan vacíos: puedes completarlos después
              importando la nómina PDF del SIE o editando al estudiante.
            </p>
          ) : null}

          {rejected.length > 0 ? (
            <ul className="flex flex-col gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              {rejected.map((r) => (
                <li key={r.rowNumber}>
                  Fila {r.rowNumber} omitida ({r.rawFullName}): {r.reason}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="min-w-0 overflow-hidden rounded-md border">
            <ScrollArea className="h-72 w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>RUDE</TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>Nacimiento</TableHead>
                    <TableHead>Género</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.rowIndex}>
                      <TableCell>{r.rowIndex}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.rudeCode ?? EMPTY_CELL}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.identityCard ?? EMPTY_CELL}
                      </TableCell>
                      <TableCell>{r.lastNames}</TableCell>
                      <TableCell>{r.names}</TableCell>
                      <TableCell>{r.birthDate ?? EMPTY_CELL}</TableCell>
                      <TableCell>
                        {r.gender ? (
                          <Badge
                            variant={r.gender === "M" ? "default" : "outline"}
                          >
                            {r.gender}
                          </Badge>
                        ) : (
                          EMPTY_CELL
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={
            enroll.isPending ||
            parsing ||
            rows.length === 0 ||
            !courseId ||
            !course
          }
          onClick={handleSubmit}
        >
          {enroll.isPending
            ? "Inscribiendo…"
            : `Inscribir ${rows.length} estudiantes`}
        </Button>
      </div>
    </div>
  )
}
