import { useState } from "react"
import {
  FileTextIcon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react"

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

import { parseStudentsPdf } from "../helpers/pdfParser"
import { useEnrollBatch } from "../hooks/useEnroll"
import type { ParsedStudentRow } from "../types"
import { GradeParallelPicker } from "./GradeParallelPicker"

export interface AutomatedEnrollFormProps {
  onSuccess: () => void
}

export function AutomatedEnrollForm({ onSuccess }: AutomatedEnrollFormProps) {
  const [gradeId, setGradeId] = useState<number | undefined>()
  const [parallelId, setParallelId] = useState<number | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedStudentRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const enroll = useEnrollBatch()

  const handleFile = async (selected: File | null) => {
    setFile(selected)
    setRows([])
    setParseError(null)
    if (!selected) return
    setParsing(true)
    try {
      const parsed = await parseStudentsPdf(selected)
      if (parsed.length === 0) {
        setParseError(
          "No se detectaron filas validas. Verifica el formato del PDF.",
        )
      }
      setRows(parsed)
    } catch (e) {
      setParseError(
        e instanceof Error ? e.message : "Error al procesar el PDF.",
      )
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async () => {
    if (!gradeId || !parallelId || rows.length === 0) return
    try {
      await enroll.mutateAsync({
        id_grade: gradeId,
        id_parallel: parallelId,
        students: rows.map(
          ({ rudeCode, identityCard, names, lastNames, birthDate, gender }) => ({
            rudeCode,
            identityCard,
            names,
            lastNames,
            birthDate,
            gender,
          }),
        ),
      })
      onSuccess()
    } catch {
      /* toast via interceptor */
    }
  }

  const maleCount = rows.filter((r) => r.gender === "M").length
  const femaleCount = rows.length - maleCount

  return (
    <div className="flex flex-col gap-4">
      <GradeParallelPicker
        gradeId={gradeId}
        parallelId={parallelId}
        onChange={(n) => {
          setGradeId(n.gradeId)
          setParallelId(n.parallelId)
        }}
        disabled={enroll.isPending || parsing}
      />

      <label
        htmlFor="pdf-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-univalle/30 bg-univalle/5 p-6 text-sm hover:border-univalle/60"
      >
        <UploadCloudIcon className="size-8 text-univalle" />
        <span className="font-medium">
          {file ? file.name : "Subir nomina PDF"}
        </span>
        <span className="text-xs text-muted-foreground">
          Formato SIE — Estudiantes inscritos por curso
        </span>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={parsing || enroll.isPending}
        />
      </label>

      {parsing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Procesando PDF...
        </div>
      ) : null}

      {parseError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {parseError}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="flex items-center gap-3 text-sm">
            <FileTextIcon className="size-4 text-univalle" />
            <span className="font-medium">{rows.length} estudiantes</span>
            <Badge variant="secondary">{maleCount} niños</Badge>
            <Badge variant="secondary">{femaleCount} niñas</Badge>
          </div>

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
                    <TableHead>Genero</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.rowIndex}>
                      <TableCell>{r.rowIndex}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.rudeCode}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.identityCard}
                      </TableCell>
                      <TableCell>{r.lastNames}</TableCell>
                      <TableCell>{r.names}</TableCell>
                      <TableCell>{r.birthDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={r.gender === "M" ? "default" : "outline"}
                        >
                          {r.gender}
                        </Badge>
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
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={
            enroll.isPending ||
            parsing ||
            rows.length === 0 ||
            !gradeId ||
            !parallelId
          }
          onClick={handleSubmit}
        >
          {enroll.isPending
            ? "Inscribiendo..."
            : `Inscribir ${rows.length} estudiantes`}
        </Button>
      </div>
    </div>
  )
}
