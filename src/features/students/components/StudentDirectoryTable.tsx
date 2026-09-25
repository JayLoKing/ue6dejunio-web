import { InfoIcon, UserMinusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/shared/DataTablePagination"

import type { StudentDirectoryResponse } from "../models/response/student-directory-response"

const WITHDRAWN = "Withdrawn"
const EFFECTIVE = "Effective"

const STATUS_LABEL: Record<string, string> = {
  Effective: "Activo",
  Withdrawn: "Dado de baja",
}

/** Lo que se muestra donde el estudiante todavía no tiene curso en la gestión consultada. */
const EMPTY_CELL = "—"

export interface StudentDirectoryTableProps {
  rows: StudentDirectoryResponse[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  isFetching?: boolean
  onRefresh?: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Abre el motivo de una baja ya hecha. */
  onOpenWithdrawal: (studentId: string) => void
  /**
   * Da de baja. Ausente, la columna no ofrece la acción: dar de baja es del Director, y la
   * secretaría lee este mismo listado.
   */
  onWithdraw?: (student: StudentDirectoryResponse) => void
}

export function StudentDirectoryTable({
  rows,
  page,
  pageSize,
  total,
  totalPages,
  isFetching,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onOpenWithdrawal,
  onWithdraw,
}: StudentDirectoryTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUDE</TableHead>
              <TableHead>Carnet</TableHead>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Paralelo</TableHead>
              <TableHead>Gestión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Sin estudiantes.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.rudeCode}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.identityCard}
                  </TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>{s.grade ?? EMPTY_CELL}</TableCell>
                  <TableCell>{s.parallel ?? EMPTY_CELL}</TableCell>
                  <TableCell>{s.academicYear ?? EMPTY_CELL}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.status === WITHDRAWN ? "outline" : "secondary"}
                    >
                      {/* Un estado que no está en el mapa se muestra tal cual: inventar una
                          traducción para algo que el backend agregó después dice menos. */}
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === WITHDRAWN ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Ver el motivo de la baja"
                        onClick={() => onOpenWithdrawal(s.id)}
                      >
                        <InfoIcon className="size-4" />
                        <span className="sr-only">
                          Ver el motivo de la baja de {s.fullName}
                        </span>
                      </Button>
                    ) : s.status === EFFECTIVE && onWithdraw ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Dar de baja"
                        onClick={() => onWithdraw(s)}
                      >
                        <UserMinusIcon className="size-4" />
                        <span className="sr-only">
                          Dar de baja a {s.fullName}
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
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
