import { useMemo, useState } from "react"
import { SearchIcon, UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/shared/DataTablePagination"

import type { Gender } from "../types"

export interface StudentRow {
  id: string
  rudeCode: string
  identityCard: string
  lastNames: string
  names: string
  birthDate: string
  gender: Gender
  subjects: string[]
}

export interface StudentsTableProps {
  data: StudentRow[]
  pageSize?: number
  isFetching?: boolean
  onRefresh?: () => void
}

type GenderFilter = "ALL" | Gender

export function StudentsTable({
  data,
  pageSize = 10,
  isFetching,
  onRefresh,
}: StudentsTableProps) {
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(pageSize)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((s) => {
      if (genderFilter !== "ALL" && s.gender !== genderFilter) return false
      if (!q) return true
      return (
        s.rudeCode.toLowerCase().includes(q) ||
        s.identityCard.toLowerCase().includes(q) ||
        s.names.toLowerCase().includes(q) ||
        s.lastNames.toLowerCase().includes(q)
      )
    })
  }, [data, search, genderFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / size))
  const currentPage = Math.min(page, totalPages - 1)
  const pageData = filtered.slice(
    currentPage * size,
    currentPage * size + size,
  )

  const maleCount = data.filter((s) => s.gender === "M").length
  const femaleCount = data.length - maleCount

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-univalle/15 text-univalle">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{data.length}</div>
              <div className="text-xs text-muted-foreground">
                Total inscritos
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{maleCount}</div>
              <div className="text-xs text-muted-foreground">Niños (M)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-pink-500/15 text-pink-600 dark:text-pink-400">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{femaleCount}</div>
              <div className="text-xs text-muted-foreground">Niñas (F)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
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

        <Select
          value={genderFilter}
          onValueChange={(v) => {
            setGenderFilter(v as GenderFilter)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="M">Niños (M)</SelectItem>
            <SelectItem value="F">Niñas (F)</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} resultado(s)
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUDE</TableHead>
              <TableHead>Carnet</TableHead>
              <TableHead>Apellidos</TableHead>
              <TableHead>Nombres</TableHead>
              <TableHead>Nacimiento</TableHead>
              <TableHead>Genero</TableHead>
              <TableHead>Materias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Sin estudiantes.
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.rudeCode}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.identityCard}
                  </TableCell>
                  <TableCell>{s.lastNames}</TableCell>
                  <TableCell>{s.names}</TableCell>
                  <TableCell>{s.birthDate}</TableCell>
                  <TableCell>
                    <Badge variant={s.gender === "M" ? "default" : "outline"}>
                      {s.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.subjects.length > 0
                      ? `${s.subjects.length} materia(s)`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={currentPage + 1}
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
