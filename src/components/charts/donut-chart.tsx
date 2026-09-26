import { Group } from "@visx/group"
import { ParentSize } from "@visx/responsive"
import { Pie } from "@visx/shape"
import { motion } from "motion/react"
import { useId, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

export interface DonutSlice {
  label: string
  value: number
  /** Un color de la paleta, como `var(--chart-1)`. */
  color: string
}

export interface DonutChartProps {
  data: DonutSlice[]
  /** Qué son las unidades del total: "estudiantes", "materias". */
  centerLabel?: string
  /** Grosor del anillo como fracción del radio (0-1). Por defecto 0.38. */
  thickness?: number
  className?: string
}

const sum = (data: DonutSlice[]) => data.reduce((acc, d) => acc + d.value, 0)

/**
 * Un anillo para una proporción, no un gráfico de torta.
 *
 * ES UN ANILLO Y NO UNA TORTA a propósito. La torta pide comparar ángulos, que es lo que peor hace
 * el ojo humano — de ahí la mala fama del formato. El anillo deja de pedirlo: el hueco del medio
 * sostiene el total, y la comparación pasa a hacerse con los números de la leyenda. Lo que el
 * dibujo aporta es lo único que hace bien, que es "una parte contra el todo" de un vistazo.
 *
 * POR ESO LA LEYENDA LLEVA VALOR Y PORCENTAJE. Un anillo sin números se lee "más o menos un
 * cuarto", y eso no es una medición. Además es lo único que le queda a quien no distingue los
 * colores del anillo.
 *
 * NO COMPARTE EL ANDAMIAJE DE `BarChart`. Ese componente existe para ejes, series múltiples y
 * tooltips sincronizados entre ellas; un anillo no tiene ejes ni series que sincronizar, y
 * heredarlo serían seiscientas líneas de contexto para no usar ninguna. Comparte lo que importa,
 * que son los tokens de color y el gesto de la animación.
 */
export function DonutChart({
  data,
  centerLabel,
  thickness = 0.38,
  className,
}: DonutChartProps) {
  const total = useMemo(() => sum(data), [data])
  const [hovered, setHovered] = useState<string | null>(null)
  const titleId = useId()

  // Cero total es "todavía no hay nada", no un anillo de radio cero. Dibujarlo igual daría un
  // gráfico que parece medir algo y mide la ausencia de datos.
  if (data.length === 0 || total === 0) {
    return (
      <p
        className={cn(
          "py-8 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Sin datos para mostrar.
      </p>
    )
  }

  const shown = data.find((d) => d.label === hovered)
  const centerValue = shown ? shown.value : total
  const centerText = shown ? shown.label : (centerLabel ?? "total")

  return (
    <div
      className={cn("flex flex-col items-center gap-4 sm:flex-row", className)}
    >
      <div className="relative aspect-square w-full max-w-[13rem] shrink-0">
        <ParentSize>
          {({ width }) => {
            if (width < 10) return null
            const radius = width / 2
            return (
              <svg aria-labelledby={titleId} height={width} width={width}>
                <title id={titleId}>
                  Distribución de {total} en {data.length} categorías
                </title>
                <Group left={radius} top={radius}>
                  <Pie
                    cornerRadius={3}
                    data={data}
                    innerRadius={radius * (1 - thickness)}
                    outerRadius={radius}
                    padAngle={0.015}
                    pieValue={(d) => d.value}
                  >
                    {(pie) =>
                      pie.arcs.map((arc, i) => {
                        const slice = arc.data
                        const isDimmed =
                          hovered !== null && hovered !== slice.label
                        return (
                          // `animate` y no `whileInView`: el anillo vive dentro de una tarjeta que
                          // ya está en pantalla cuando se monta, así que esperar a que entre al
                          // viewport es esperar un evento que no va a llegar. Un solo `animate`
                          // sirve además para las dos cosas — la entrada y el atenuado del hover —
                          // y evita que se peleen por la misma propiedad.
                          <motion.path
                            animate={{
                              opacity: isDimmed ? 0.35 : 1,
                              scale: 1,
                            }}
                            aria-label={`${slice.label}: ${slice.value}`}
                            d={pie.path(arc) ?? undefined}
                            fill={slice.color}
                            initial={{ opacity: 0, scale: 0.9 }}
                            key={slice.label}
                            onMouseEnter={() => setHovered(slice.label)}
                            onMouseLeave={() => setHovered(null)}
                            role="img"
                            style={{ transformOrigin: "center" }}
                            transition={{
                              duration: 0.45,
                              delay: i * 0.06,
                              ease: "easeOut",
                            }}
                          />
                        )
                      })
                    }
                  </Pie>
                </Group>
              </svg>
            )
          }}
        </ParentSize>

        {/* El centro, en HTML y no en <text>: hereda la tipografía de la página y se recorta solo
            cuando la palabra es larga, cosa que en SVG hay que calcular a mano. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-semibold tabular-nums"
            data-testid="donut-total"
          >
            {centerValue}
          </span>
          <span className="max-w-[70%] truncate text-xs text-muted-foreground">
            {centerText}
          </span>
        </div>
      </div>

      <ul aria-label="Leyenda" className="min-w-0 flex-1 space-y-2 text-sm">
        {data.map((slice) => (
          <li
            className="flex items-center gap-2"
            key={slice.label}
            onMouseEnter={() => setHovered(slice.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {slice.value}
            </span>
            <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">
              {Math.round((slice.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
