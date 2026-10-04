import { useState } from "react"
import { UserCogIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { isRole } from "@/features/auth/types"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useResendCredentials } from "@/features/users/hooks/useResendCredentials"

import { useCancelHandover } from "../hooks/useCancelHandover"
import { useDirectorHandover } from "../hooks/useDirectorHandover"

/**
 * El aviso fijo mientras un cambio de Director espera al reemplazante.
 *
 * Es de todos los Directores y no sólo del que lo inició: mientras el cambio está abierto hay dos
 * cuentas con la dirección, y cualquiera que entre tiene que saber que una de ellas se va a cerrar.
 * Es una barra fija, no un modal, por la misma razón que el aviso de sesión: tapar la pantalla
 * trabaría justo lo que la persona está haciendo.
 *
 * Cancelar sólo se ofrece al Director saliente; la API le contesta 403 a cualquier otro.
 *
 * Si la lectura falla y no hay un dato previo, no se muestra nada: un aviso inventado sería peor
 * que ninguno, y el error ya lo cuenta el interceptor. Si había uno, react-query lo conserva.
 */
export function DirectorHandoverBanner() {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const isDirector = isRole(role, "DIRECTOR")

  const { data: handover } = useDirectorHandover(isDirector)
  const resend = useResendCredentials()
  const cancel = useCancelHandover()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  if (!isDirector || !handover) return null

  const { incoming, outgoing } = handover
  const canCancel = outgoing.id === userId

  return (
    <>
      <div
        className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning/30 bg-warning/12 px-4 py-2.5 text-sm"
        role="status"
      >
        <UserCogIcon className="size-4 shrink-0 text-warning" />
        <p className="min-w-0">
          <span className="font-medium">
            {incoming.mustChangePassword
              ? `Cambio de Director pendiente: ${incoming.fullName} aún no ingresó.`
              : `Cambio de Director pendiente: ${incoming.fullName} ya cambió su contraseña.`}
          </span>{" "}
          <span className="text-muted-foreground">
            {incoming.mustChangePassword
              ? "Cuando lo haga, la dirección pasa a esa cuenta y la actual se cierra."
              : "El cambio se completa en el próximo pedido."}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Button
            disabled={!incoming.mustChangePassword || resend.isPending}
            onClick={() => resend.mutate(incoming.id)}
            size="sm"
            variant="outline"
          >
            Reenviar credenciales
          </Button>
          {canCancel ? (
            <Button
              onClick={() => setConfirmingCancel(true)}
              size="sm"
              variant="outline"
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancelar el cambio de Director"
        description={`${incoming.fullName} dejará de ser el reemplazo y tu cuenta seguirá siendo la de Director. Si su cuenta se creó para este cambio, se dará de baja; si ya existía, recupera su rol anterior.`}
        confirmLabel="Cancelar el cambio"
        destructive
        loading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(undefined, {
            onSettled: () => setConfirmingCancel(false),
          })
        }
        onOpenChange={setConfirmingCancel}
      />
    </>
  )
}
