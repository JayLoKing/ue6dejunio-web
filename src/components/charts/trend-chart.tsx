import { Group } from "@visx/group"
import { ParentSize } from "@visx/responsive"
import { scalePoint, scaleLinear } from "@visx/scale"
import { LinePath } from "@visx/shape"
import { motion } from "motion/react"
import { useId, useMemo } from "react"

import { cn } from "@/lib/utils"

export interface TrendPoint {
  /** La categoría del eje: un trimestre, un mes. */
  x: string
  /** El valor, o `null` si no se midió. Un hueco no es un cero. */
  y: number | null
}

export interface TrendSeries {
  label: string
  color: string
  points: TrendPoint[]
}

export interface TrendChartProps {
  series: TrendSeries[]
  /** Fuerza el techo del eje. Sin esto se toma del dato más alto. */
  maxY?: number
  /** Sufijo para los valores leídos por un lector de pantalla: "%", " pts". */
  unit?: string
  className?: string
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 34 }

/**
 * Una serie corta en el tiempo: tres trimestres, diez meses.
 *
 * ES PARA POCOS PUNTOS, y eso decide el dibujo. Con tres trimestres la línea no es una tendencia
 * estadística, es un "subió o bajó": por eso cada punto lleva su marca visible y su valor, en vez
 * de ser una curva suave donde hay que adivinar dónde cae cada medición.
 *
 * EL HUECO NO ES UN CERO. Un trimestre sin medir corta la línea y no la baja al piso: bajarla
 * dibuja un derrumbe que nunca ocurrió. Es la misma regla que sostiene el modelo en el repositorio
 * de IA, y por el mismo motivo — un promedio que no se calculó no es un promedio de cero.
 *
 * LA LÍNEA SE DIBUJA SOLA AL ENTRAR, animando el trazo con `pathLength`. Es la única animación que
 * un gráfico de líneas puede permitirse sin mentir: cualquier otra mueve los puntos, y un punto que
 * se mueve es un dato que parece cambiar.
 */
export function TrendChart({
  series,
  maxY,
  unit = "",
  className,
}: TrendChartProps) {
  const titleId = useId()

  const measured = useMemo(
    () => series.filter((s) => s.points.some((p) => p.y !== null)),
    [series]
  )

  const categories = useMemo(
    () => (measured[0]?.points ?? []).map((p) => p.x),
    [measured]
  )

  const top = useMemo(() => {
    if (maxY !== undefined) return maxY
    const values = measured.flatMap((s) =>
      s.points.map((p) => p.y).filter((v): v is number => v !== null)
    )
    // Un diez por ciento de aire arriba: una línea que toca el borde se lee como cortada.
    return values.length ? Math.max(...values) * 1.1 : 1
  }, [measured, maxY])

  if (measured.length === 0 || categories.length === 0) {
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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="aspect-[2/1] w-full">
        <ParentSize>
          {({ width, height }) => {
            if (width < 10) return null
            const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
            const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom)
            const x = scalePoint({ domain: categories, range: [0, innerW] })
            const y = scaleLinear({ domain: [0, top], range: [innerH, 0] })

            return (
              <svg aria-labelledby={titleId} height={height} width={width}>
                <title id={titleId}>
                  Evolución de {measured.map((s) => s.label).join(", ")}
                </title>
                <Group left={MARGIN.left} top={MARGIN.top}>
                  {/* Tres líneas de referencia y nada más. Una grilla densa compite con el dato
                      cuando el dato son tres puntos. */}
                  {[0, 0.5, 1].map((t) => (
                    <line
                      key={t}
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                      x1={0}
                      x2={innerW}
                      y1={y(top * t)}
                      y2={y(top * t)}
                    />
                  ))}

                  {categories.map((c) => (
                    <text
                      className="fill-[var(--chart-label)] text-[10px]"
                      key={c}
                      textAnchor="middle"
                      x={x(c) ?? 0}
                      y={innerH + 18}
                    >
                      {c}
                    </text>
                  ))}

                  {measured.map((s) => {
                    const drawable = s.points.filter(
                      (p): p is { x: string; y: number } => p.y !== null
                    )
                    return (
                      <Group key={s.label}>
                        <motion.g
                          animate={{ pathLength: 1 }}
                          initial={{ pathLength: 0 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          <LinePath
                            curve={undefined}
                            data={drawable}
                            stroke={s.color}
                            strokeLinecap="round"
                            strokeWidth={2}
                            x={(p) => x(p.x) ?? 0}
                            y={(p) => y(p.y)}
                          />
                        </motion.g>
                        {drawable.map((p, i) => (
                          <motion.circle
                            animate={{ opacity: 1, scale: 1 }}
                            aria-label={`${s.label} en ${p.x}: ${p.y}${unit}`}
                            cx={x(p.x) ?? 0}
                            cy={y(p.y)}
                            fill="var(--chart-background)"
                            initial={{ opacity: 0, scale: 0.5 }}
                            key={p.x}
                            r={4}
                            role="img"
                            stroke={s.color}
                            strokeWidth={2}
                            transition={{ delay: 0.5 + i * 0.08 }}
                          />
                        ))}
                      </Group>
                    )
                  })}
                </Group>
              </svg>
            )
          }}
        </ParentSize>
      </div>

      <ul
        aria-label="Leyenda"
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
      >
        {measured.map((s) => (
          <li className="flex items-center gap-1.5" key={s.label}>
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
