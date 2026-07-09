import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export interface StudentRow {
  courseEnrollmentId: string
  rudeCode: string
  identityCard: string
  fullName: string
  status: string
}

export interface StudentsTableProps {
  data: StudentRow[]
  pageSize?: number
  isFetching?: boolean
  onRefresh?: () => void
}

export function StudentsTable({
  data,
  pageSize = 10,
  isFetching,
  onRefresh,
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
        s.identityCard.toLowerCase().includes(q),
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
          placeholder="Buscar por RUDE, carnet, nombre..."
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin estudiantes.
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((s) => (
                <TableRow key={s.courseEnrollmentId}>
                  <TableCell className="font-mono text-xs">{s.rudeCode}</TableCell>
                  <TableCell className="font-mono text-xs">{s.identityCard}</TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.status}</Badge>
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
