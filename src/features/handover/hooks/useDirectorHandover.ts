import { useQuery } from "@tanstack/react-query"

import { HandoverService } from "../services/handoverService"

export const handoverKeys = {
  all: ["director-handover"] as const,
  pending: ["director-handover", "pending"] as const,
}

/** Cada cuánto se relee mientras la pestaña está en primer plano: lo bastante para ver el cierre. */
const POLL_MS = 60_000

/**
 * El cambio de Director pendiente, o `null` si no hay (204).
 *
 * Sólo se consulta si la persona es Director: la ruta es de Directores y a cualquier otro rol le
 * contestaría 403. Relee al volver a la pestaña y cada minuto, porque el cambio se cierra del otro
 * lado —cuando el reemplazante cambia su contraseña— y nadie en esta pantalla hace nada que lo
 * enterara. Un error de lectura conserva el último dato en vez de borrar el aviso.
 */
export function useDirectorHandover(enabled: boolean) {
  return useQuery({
    queryKey: handoverKeys.pending,
    queryFn: () => HandoverService.pending(),
    enabled,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
