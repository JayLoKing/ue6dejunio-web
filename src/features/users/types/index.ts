export interface RoleOption {
  id: number
  name: string
  label: string
}

export const ROLES: readonly RoleOption[] = [
  { id: 1, name: "DIRECTOR", label: "Director" },
  { id: 2, name: "SECRETARIO", label: "Secretario" },
  { id: 3, name: "DOCENTE", label: "Docente" },
] as const
