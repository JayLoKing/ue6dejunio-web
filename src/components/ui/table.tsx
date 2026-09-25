import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

/**
 * El encabezado se distingue por superficie, no por negrita.
 *
 * Sólo tenía una línea abajo, así que la primera fila de datos y los nombres de las columnas se
 * leían como el mismo bloque. Un fondo tenue los separa sin gritar, y sin recurrir a mayúsculas:
 * en esta aplicación hay encabezados como "Acciones, estrategias y/o adaptaciones curriculares",
 * y en versalitas eso deja de ser legible.
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/50 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * El borde de la fila es más tenue que el resto.
 *
 * Una tabla de treinta estudiantes con el borde pleno es treinta líneas negras: la reja se ve antes
 * que los datos. A media opacidad la fila sigue separada y lo que se lee primero son los nombres.
 * La fila señalada por el teclado o el mouse se marca con color, que es cuando hace falta.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/60 transition-colors hover:bg-muted/60 has-aria-expanded:bg-muted/60 data-[state=selected]:bg-primary/[0.07]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-3 text-left align-middle text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * `tabular-nums` es el detalle que hace legible una tabla de notas.
 *
 * Por defecto una fuente usa cifras proporcionales: el 1 es más angosto que el 8, así que en una
 * columna de calificaciones las unidades no caen alineadas y el ojo no puede comparar dos números
 * mirándolos uno debajo del otro — hay que leerlos. Las cifras tabulares tienen todas el mismo
 * ancho, la columna se alinea sola y la tabla pasa a poder recorrerse en vertical.
 *
 * Va en cada celda y no sólo en las numéricas porque una celda no sabe qué le van a poner adentro,
 * y en el texto corriente la diferencia es invisible.
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle whitespace-nowrap tabular-nums [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
