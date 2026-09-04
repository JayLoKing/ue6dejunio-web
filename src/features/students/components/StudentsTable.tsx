import { useMemo, useState } from "react"
import { InfoIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"

import type { StudentRow } from "../types"

/** El estado que el backend escribe cuando se da de baja a un estudiante. */
const WITHDRAWN = "Withdrawn"

/** Lo que la columna guarda, en las palabras con las que se lee el padrón. */
const STATUS_LABEL: Record<string, string> = {
  Effective: "Activo",
  Withdrawn: "Dado de baja",
}

export interface StudentsTableProps {
  data: StudentRow[]
  pageSize?: number
  isFetching?: boolean
  onRefresh?: () => void
  /**
   * Abre el motivo de la baja. Sin esto la tabla no lo ofrece: el padrón se muestra en más de una
   * pantalla, y no todas tienen dónde abrirlo.
   */
  onOpenWithdrawal?: (studentId: string) => void
}

export function StudentsTable({
  data,
  pageSize = 10,
  isFetching,
  onRefresh,
  onOpenWithdrawal,
}: StudentsTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(pageSize)
  const q = useDebouncedValue(search, 250).trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return data
    return data.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.rudeCode.toLowerCase().includes(q) ||
        s.identityCard.toLowerCase().includes(q)
    )
  }, [data, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, totalPages - 1)
  const pageData = filtered.slice(current * size, current * size + size)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por RUDE, carnet, nombre…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUDE</TableHead>
              <TableHead>Carnet</TableHead>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Sin estudiantes.
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((s) => (
                <TableRow key={s.courseEnrollmentId}>
                  <TableCell className="font-mono text-xs">
                    {s.rudeCode}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.identityCard}
                  </TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {/* Un estado que no está en el mapa se muestra tal cual: inventar una
                          traducción para algo que el backend agregó después dice menos. */}
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Sólo la fila que despierta la pregunta puede contestarla. */}
                    {s.status === WITHDRAWN && onOpenWithdrawal ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Ver el motivo de la baja"
                        onClick={() => onOpenWithdrawal(s.studentId)}
                      >
                        <InfoIcon className="size-4" />
                        <span className="sr-only">
                          Ver el motivo de la baja de {s.fullName}
                        </span>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={current + 1}
        pageSize={size}
        total={filtered.length}
        totalPages={totalPages}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onPageChange={(p) => setPage(p - 1)}
        onPageSizeChange={(s) => {
          setSize(s)
          setPage(0)
        }}
      />
    </div>
  )
}
