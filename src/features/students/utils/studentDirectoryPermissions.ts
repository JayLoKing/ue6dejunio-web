import { isRole } from "@/features/auth/types"

/**
 * Lo que el rol puede hacer sobre una fila del directorio.
 *
 * La ruta la comparten Dirección y secretaría: la secretaría lee el padrón, pero mover a un
 * estudiante (retirarlo o reincorporarlo) es de la Dirección. Vive aparte para poder probar la
 * decisión sin montar la ruta.
 */
export interface DirectoryPermissions {
  canWithdraw: boolean
  canReinstate: boolean
}

export function directoryPermissions(
  role: string | null
): DirectoryPermissions {
  const isDirector = isRole(role, "DIRECTOR")
  return { canWithdraw: isDirector, canReinstate: isDirector }
}
