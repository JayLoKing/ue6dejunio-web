import { Link } from "@tanstack/react-router"
import {
  BookOpenIcon,
  InfoIcon,
  PencilIcon,
  UserCheckIcon,
  UserMinusIcon,
} from "lucide-react"

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
import { enrollmentStatusLabel } from "@/lib/labels"
import { EFFECTIVE, WITHDRAWN } from "@/lib/enrollment"

import { IncompleteDataBadge } from "./IncompleteDataBadge"

/**
 * Lo que se muestra donde la fila no trae el dato: el curso de quien no está inscrito en la gestión
 * consultada, o el RUDE y el carnet de quien se inscribió sólo con el nombre.
 */
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
  /** Reincorpora a un retirado. Ausente, no se ofrece: también es del Director. */
  onReinstate?: (student: StudentDirectoryResponse) => void
  /** Ofrece abrir el cuaderno del curso de la fila. Ausente, no hay enlace. */
  canOpenCourse?: boolean
  /** Abre la edición de los datos del estudiante. Ausente, la tabla no la ofrece. */
  onEdit?: (studentId: string) => void
  /**
   * Qué filas puede editar quien mira. Sin esto, ninguna: la regla depende del rol y del curso de
   * la fila, y la tabla no sabe quién mira.
   */
  canEdit?: (student: StudentDirectoryResponse) => boolean
}

/** El enlace al cuaderno: sólo con permiso y con un curso al que ir (el sin inscribir no lo tiene). */
function courseLink(s: StudentDirectoryResponse, canOpenCourse?: boolean) {
  if (!canOpenCourse || !s.courseId || s.parallelId === null) return null
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-8"
      title="Ver curso"
      asChild
    >
      <Link
        to="/cursos/$parallelId/curso/$courseId"
        params={{ parallelId: String(s.parallelId), courseId: s.courseId }}
      >
        <BookOpenIcon className="size-4" />
        <span className="sr-only">Ver curso de {s.fullName}</span>
      </Link>
    </Button>
  )
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
  onReinstate,
  canOpenCourse,
  onEdit,
  canEdit,
}: StudentDirectoryTableProps) {
  const editButton = (s: StudentDirectoryResponse) =>
    onEdit && canEdit?.(s) ? (
      <Button
        size="icon"
        variant="ghost"
        className="size-8"
        title="Editar datos"
        onClick={() => onEdit(s.id)}
      >
        <PencilIcon className="size-4" />
        <span className="sr-only">Editar datos de {s.fullName}</span>
      </Button>
    ) : null

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
              <TableHead className="w-28" />
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
                    {s.rudeCode ?? EMPTY_CELL}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.identityCard ?? EMPTY_CELL}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {s.fullName}
                      {s.incomplete ? <IncompleteDataBadge /> : null}
                    </div>
                  </TableCell>
                  <TableCell>{s.grade ?? EMPTY_CELL}</TableCell>
                  <TableCell>{s.parallel ?? EMPTY_CELL}</TableCell>
                  <TableCell>{s.academicYear ?? EMPTY_CELL}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.status === WITHDRAWN ? "outline" : "secondary"}
                    >
                      {enrollmentStatusLabel(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === WITHDRAWN ? (
                      <div className="flex justify-end gap-1">
                        {editButton(s)}
                        {courseLink(s, canOpenCourse)}
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
                        {onReinstate ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            title="Reincorporar"
                            onClick={() => onReinstate(s)}
                          >
                            <UserCheckIcon className="size-4" />
                            <span className="sr-only">
                              Reincorporar a {s.fullName}
                            </span>
                          </Button>
                        ) : null}
                      </div>
                    ) : s.status === EFFECTIVE ? (
                      <div className="flex justify-end gap-1">
                        {editButton(s)}
                        {courseLink(s, canOpenCourse)}
                        {onWithdraw ? (
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
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {editButton(s)}
                      </div>
                    )}
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
