export interface RoleOption {
  id: number
  name: string
  label: string
}

export const ROLES: readonly RoleOption[] = [
  { id: 1, name: "DIRECTOR", label: "Director" },
  { id: 2, name: "SECRETARY", label: "Secretario" },
  { id: 3, name: "TEACHER", label: "Docente" },
] as const
