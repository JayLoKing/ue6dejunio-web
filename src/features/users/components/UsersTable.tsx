import { useState } from "react"
import { SearchIcon, UserMinusIcon } from "lucide-react"

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

import { useUsers } from "../hooks/useUsers"
import { useDeactivateUser } from "../hooks/useDeactivateUser"

const PAGE_SIZE = 20

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
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching } = useUsers({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
  })
  const deactivate = useDeactivateUser()

  const handleDeactivate = (id: string, name: string) => {
    if (!confirm(`Dar de baja a ${name}?`)) return
    deactivate.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, CI o correo..."
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
            ) : !data || data.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.ci}</TableCell>
                  <TableCell>
                    {u.names} {u.lastNames}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!u.active || deactivate.isPending}
                      onClick={() =>
                        handleDeactivate(u.id, `${u.names} ${u.lastNames}`)
                      }
                    >
                      <UserMinusIcon data-icon="inline-start" />
                      Baja
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Pagina {data.page + 1} de {Math.max(data.totalPages, 1)} —{" "}
            {data.total} usuario(s){isFetching ? " (actualizando)" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
