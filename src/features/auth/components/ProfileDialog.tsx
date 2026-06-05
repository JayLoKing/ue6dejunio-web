import { Loader2Icon, MailIcon, ShieldIcon, UserIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import { useMe } from "../hooks/useMe"
import { useAuthStore } from "../store/authStore"

export interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
      <Icon className="size-4 text-univalle" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: me, isLoading, isError } = useMe(open)
  const storeFullName = useAuthStore((s) => s.fullName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
          <DialogDescription>Datos de tu cuenta institucional.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : isError || !me ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No se pudo cargar el perfil.
          </div>
        ) : (
          (() => {
            const displayName = me.name?.trim() || storeFullName || "Usuario"
            return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-univalle text-univalle-foreground">
                  {displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">{displayName}</span>
                <Badge variant="secondary" className="w-fit">
                  {me.role}
                </Badge>
              </div>
            </div>

            <Row icon={UserIcon} label="Nombre" value={displayName} />
            <Row icon={MailIcon} label="Correo" value={me.email} />
            <Row icon={ShieldIcon} label="Rol" value={me.role} />
            {me.gradeName ? (
              <Row
                icon={UserIcon}
                label="Curso"
                value={`${me.gradeName}${me.parallelName ? ` "${me.parallelName}"` : ""}`}
              />
            ) : null}
          </div>
            )
          })()
        )}
      </DialogContent>
    </Dialog>
  )
}
