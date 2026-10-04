import type { UserLookup } from "../models/response/handover-response"

export type LookupOutcome =
  | { kind: "new" }
  | { kind: "promote"; user: UserLookup }
  | { kind: "blocked"; message: string }

/**
 * Qué hacer con el resultado de buscar el correo, antes de mandar nada.
 *
 * El POST con un correo que ya existe ASCIENDE a esa persona en el momento, sin pedir confirmación:
 * por eso el formulario pregunta primero. Los casos que la API termina rechazando con 409 —el
 * propio correo, quien ya es Director, una cuenta de baja— se frenan acá para que la persona lo lea
 * antes de llegar a la confirmación y no como un error después de teclearla.
 */
export function classifyLookup(
  email: string,
  ownEmail: string | null,
  found: UserLookup | null
): LookupOutcome {
  if (ownEmail && email.trim().toLowerCase() === ownEmail.toLowerCase()) {
    return {
      kind: "blocked",
      message:
        "Ese es tu propio correo. Indica el de la persona que te va a reemplazar.",
    }
  }
  if (!found) return { kind: "new" }
  if (!found.active) {
    return {
      kind: "blocked",
      message:
        "Esa cuenta está dada de baja. Actívala en Usuarios antes de nombrarla Director.",
    }
  }
  if (found.role.toUpperCase() === "DIRECTOR") {
    return { kind: "blocked", message: "Esa cuenta ya es Director." }
  }
  return { kind: "promote", user: found }
}
