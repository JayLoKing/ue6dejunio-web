import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import { ClockAlertIcon, LogInIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useAuthStore } from "../store/authStore"
import { useRefreshSession } from "../hooks/useRefreshSession"
import { useSessionExpiry } from "../hooks/useSessionExpiry"

const mmss = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * El aviso de que la sesión se termina, y la pantalla de cuando ya se terminó.
 *
 * Hasta ahora el token vencía callado: el siguiente pedido volvía 401 y la aplicación saltaba al
 * login desde adentro de lo que se estuviera haciendo, sin decir por qué. Lo que se había guardado
 * estaba a salvo; lo que se estaba escribiendo, no.
 *
 * NO ES UN DIÁLOGO MODAL, y ahí está la decisión. Un modal que aparece a los tres minutos del final
 * tapa justamente el formulario que hay que terminar de guardar: sería avisar del incendio trabando
 * la puerta. Es una barra fija arriba, que se ve desde cualquier parte de la página y no impide
 * escribir ni guardar.
 *
 * VENCIDA SÍ ES MODAL. Ahí ya no hay nada que salvar — cualquier cosa que se mande vuelve 401 — y lo
 * único honesto es decirlo y ofrecer la puerta, en vez de dejar que la persona siga tipeando contra
 * una sesión que no existe.
 *
 * EL BOTÓN DE SEGUIR TRABAJANDO VA EN EL AVISO Y NO EN LA PANTALLA DE VENCIDA, y la razón es que
 * `/auth/refresh` exige un token vigente: mientras queda tiempo hay con qué renovar, y una vez
 * vencido ya no. Ofrecerlo ahí abajo sería prometer lo que la API rechaza.
 *
 * Renovar es algo que la persona aprieta, no algo que ocurre solo. Un temporizador silencioso
 * volvería la sesión indefinida mientras la pestaña viva, y estas máquinas se comparten.
 */
export function SessionExpiryNotice() {
  const { status, secondsLeft } = useSessionExpiry()
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const refresh = useRefreshSession()

  const goToLogin = () => {
    logout()
    navigate({ to: "/auth/login" })
  }

  // Dos caminos al mismo cartel. Uno es el reloj de esta pestaña llegando a cero; el otro es un 401
  // del servidor, que gana siempre: el reloj del cliente puede estar corrido, o el token pudo
  // invalidarse antes de su hora.
  if (status === "expired" || sessionExpired) {
    return (
      <div
        aria-labelledby="session-expired-title"
        aria-modal
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
        role="alertdialog"
      >
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-lg"
          initial={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-warning/12 text-warning">
            <ClockAlertIcon className="size-5" />
          </div>
          <div className="space-y-1.5">
            {/* El diálogo lo nombra por acá: un alertdialog sin nombre accesible se anuncia como
                un rol y nada más, y esta es la única frase que dice qué pasó. */}
            <p className="font-medium" id="session-expired-title">
              Tu sesión expiró
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Por seguridad, el acceso dura un tiempo limitado. Vuelve a
              ingresar para seguir trabajando.
            </p>
          </div>
          <Button className="h-11 w-full" onClick={goToLogin}>
            <LogInIcon data-icon="inline-start" />
            Ingresar de nuevo
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {status === "warning" ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning/30 bg-warning/12 px-4 py-2.5 text-sm"
          exit={{ opacity: 0, y: -8 }}
          initial={{ opacity: 0, y: -8 }}
          role="status"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <ClockAlertIcon className="size-4 shrink-0 text-warning" />
          <p className="min-w-0">
            <span className="font-medium">
              Tu sesión se cierra en{" "}
              {/* Tabular para que el contador no baile de ancho a cada segundo: con cifras
                  proporcionales el texto que le sigue se corre solo y el ojo lo persigue. */}
              <span className="tabular-nums">{mmss(secondsLeft)}</span>
            </span>{" "}
            <span className="text-muted-foreground">
              Guarda lo que estés haciendo antes de que termine.
            </span>
          </p>
          <Button
            className="ml-auto h-8"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
            size="sm"
          >
            <RefreshCwIcon data-icon="inline-start" />
            {refresh.isPending ? "Renovando…" : "Seguir trabajando"}
          </Button>
          {/* Sigue estando: renovar puede fallar, y quien prefiere cerrar y volver a entrar no
              tiene por qué esperar a que el contador llegue a cero para hacerlo. */}
          <Button onClick={goToLogin} size="sm" variant="outline">
            Ingresar de nuevo
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
