import { useMemo, useState } from "react"
import { PencilIcon, SearchIcon, UserMinusIcon } from "lucide-react"

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
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import type { SortDir } from "@/lib/types/pagination"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"

import { useUsers } from "../hooks/useUsers"
import { useDeactivateUser } from "../hooks/useDeactivateUser"
import { EditUserDialog } from "./EditUserDialog"
import type { UsersListItem } from "../models/response/user-response"

function roleVariant(role: string): "default" | "secondary" | "outline" {
  switch (role.toUpperCase()) {
    case "DIRECTOR":
      return "default"
    case "SECRETARY":
      return "secondary"
    default:
      return "outline"
  }
}

export function UsersTable() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort] = useState<SortDir>("asc")
  const [editing, setEditing] = useState<UsersListItem | null>(null)
  const [deleting, setDeleting] = useState<UsersListItem | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)

  const query = useMemo(
    () => ({
      offset: page,
      limit,
      sort,
      search: debouncedSearch || undefined,
    }),
    [page, limit, sort, debouncedSearch],
  )

  const { data, isLoading, isFetching, refetch } = useUsers(query)
  const deactivate = useDeactivateUser()

  const confirmDelete = () => {
    if (!deleting) return
    deactivate.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    })
  }

  const rows = data?.content ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, CI o correo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CI</TableHead>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.ci}</TableCell>
                  <TableCell>
                    {u.lastNames} {u.names}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "secondary" : "outline"}>
                      {u.active ? "Activo" : "Baja"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        title="Editar"
                        onClick={() => setEditing(u)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        title="Dar de baja"
                        disabled={!u.active}
                        onClick={() => setDeleting(u)}
                      >
                        <UserMinusIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setLimit(s)
          setPage(1)
        }}
      />

      <EditUserDialog user={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Dar de baja usuario"
        description={
          deleting
            ? `${deleting.names} ${deleting.lastNames} sera desactivado.`
            : undefined
        }
        confirmLabel="Dar de baja"
        destructive
        loading={deactivate.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  )
}
