export interface RoleOption {
  id: number
  name: string
  label: string
}

/** Todos los roles que existen. Sirve para LEER el rol de alguien, no para elegirlo. */
export const ROLES: readonly RoleOption[] = [
  { id: 1, name: "DIRECTOR", label: "Director" },
  { id: 2, name: "SECRETARY", label: "Secretario" },
  { id: 3, name: "TEACHER", label: "Docente" },
] as const

/**
 * Los roles que este formulario puede otorgar.
 *
 * Director queda afuera: la cuenta de dirección la crea el arranque del sistema con los datos del
 * entorno, y es una sola. Ofrecerla acá invitaría a crear una segunda dirección desde una pantalla
 * que no sabe nada de esa decisión.
 */
export const ASSIGNABLE_ROLES: readonly RoleOption[] = ROLES.filter(
  (r) => r.name !== "DIRECTOR"
)

/**
 * Las opciones para editar a alguien que ya existe.
 *
 * Si la persona tiene un rol que no se otorga —hoy, dirección— se lo incluye igual: un selector que
 * no encuentra su propio valor se dibuja vacío, y un formulario que muestra el rol en blanco parece
 * estar diciendo que no tiene ninguno.
 */
export const roleOptionsFor = (currentRoleName: string): RoleOption[] => {
  const current = ROLES.find(
    (r) => r.name === currentRoleName.toUpperCase()
  )
  if (!current || ASSIGNABLE_ROLES.includes(current)) {
    return [...ASSIGNABLE_ROLES]
  }
  return [current, ...ASSIGNABLE_ROLES]
}
