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

import { useParseStudentsPdf } from "../hooks/useParseStudentsPdf"
import { useEnrollBatch } from "../hooks/useEnroll"
import type { ParsedStudentRow } from "../types"

export interface AutomatedEnrollFormProps {
  courseId: string | null
  onSuccess: () => void
}

export function AutomatedEnrollForm({
  courseId,
  onSuccess,
}: AutomatedEnrollFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedStudentRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  const parse = useParseStudentsPdf()
  const parsing = parse.isPending
  const enroll = useEnrollBatch()

  const handleFile = async (selected: File | null) => {
    setFile(selected)
    setRows([])
    setParseError(null)
    if (!selected) return
    try {
      const parsed = await parse.mutateAsync(selected)
      if (parsed.length === 0) {
        setParseError(
          "No se detectaron filas válidas. Verifica el formato del PDF."
        )
      }
      setRows(parsed)
    } catch (e) {
      setParseError(
        e instanceof Error ? e.message : "Error al procesar el PDF."
      )
    }
  }

  const handleSubmit = async () => {
    if (!courseId || rows.length === 0) return
    try {
      await enroll.mutateAsync({
        id_course: courseId,
        students: rows.map(
          ({
            rudeCode,
            identityCard,
            names,
            lastNames,
            birthDate,
            gender,
          }) => ({
            rudeCode,
            identityCard,
            names,
            lastNames,
            birthDate,
            gender,
          })
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
      <label
        htmlFor="pdf-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand/30 bg-brand/5 p-6 text-sm hover:border-brand/60"
      >
        <UploadCloudIcon className="size-8 text-brand" />
        <span className="font-medium">
          {file ? file.name : "Subir nómina PDF"}
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
            <FileTextIcon className="size-4 text-brand" />
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
                    <TableHead>Género</TableHead>
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
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={
            enroll.isPending || parsing || rows.length === 0 || !courseId
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
