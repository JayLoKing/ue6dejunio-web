import { Badge } from "@/components/ui/badge"

/**
 * Marca a un estudiante al que le falta RUDE, carnet, fecha de nacimiento o género: quien se
 * inscribió con la planilla de la escuela trae sólo el nombre, y alguien tiene que completarlo.
 */
export function IncompleteDataBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      title="Falta RUDE, carnet, fecha de nacimiento o género"
    >
      Datos incompletos
    </Badge>
  )
}
