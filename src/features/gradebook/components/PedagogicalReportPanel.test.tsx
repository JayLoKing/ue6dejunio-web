import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PedagogicalReportPanel } from "./PedagogicalReportPanel"
import type { PedagogicalReport } from "../types"

const usePedagogicalReport = vi.hoisted(() => vi.fn())
const useSavePedagogicalReport = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({
  usePedagogicalReport,
  useSavePedagogicalReport,
}))

// El selector real lee el catálogo por react-query, que acá no tiene provider ni nada que decir
// sobre el informe. Un botón por trimestre alcanza para probar el panel.
vi.mock("@/components/shared/TrimesterSelect", () => ({
  TrimesterSelect: ({
    value,
    onChange,
  }: {
    value: number
    onChange: (t: number) => void
  }) => (
    <div>
      {[1, 2, 3].map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={t === value}
          onClick={() => onChange(t)}
        >
          Trimestre {t}
        </button>
      ))}
    </div>
  ),
}))

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...over,
})

const tally = (male: number, female: number, percentage: number | null) => ({
  male,
  female,
  total: male + female,
  percentage,
})

const sheet = (over: Partial<PedagogicalReport> = {}): PedagogicalReport => ({
  courseId: "c-1",
  gradeName: "Quinto",
  parallelName: "B",
  year: 2026,
  homeroomTeacherName: "Mamani Rosa",
  trimester: 1,
  exists: true,
  achievements: "Leen en voz alta.",
  difficulties: "Les cuesta la división.",
  stats: {
    effective: tally(10, 12, 100),
    passed: tally(8, 11, 86.36),
    failed: tally(2, 1, 13.64),
  },
  failingStudents: [
    {
      number: 1,
      courseEnrollmentId: "ce-1",
      studentId: "st-1",
      fullName: "Quispe Ana",
      failedAreas: [
        { classGroupId: "cg-1", subjectName: "Matemática", mark: 45 },
        { classGroupId: "cg-2", subjectName: "Lengua", mark: 48 },
      ],
      actions: "Refuerzo los martes.",
      verificationSource: "Cuaderno de refuerzo.",
    },
  ],
  updatedAt: "2026-09-14T10:00:00",
  ...over,
})

const mutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useSavePedagogicalReport.mockReturnValue({ mutate, isPending: false })
})

describe("PedagogicalReportPanel", () => {
  /**
   * Un informe en blanco y un fetch caído se ven igual, y son cosas opuestas: el primero invita a
   * escribir, el segundo dice que lo escrito no se leyó. Guardar sobre el segundo lo sobrescribe.
   */
  it("dice que el informe no cargó en vez de mostrar un formulario vacío", () => {
    usePedagogicalReport.mockReturnValue(query({ isError: true }))

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Logros/)).not.toBeInTheDocument()
  })

  it("nombra el curso y al docente que firma", () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByText(/Quinto B/)).toBeInTheDocument()
    expect(screen.getByText(/Mamani Rosa/)).toBeInTheDocument()
  })

  /** La sección III se deriva: nadie la escribe, y los porcentajes son los de la planilla. */
  it("muestra la estadística de efectivos, aprobados y reprobados", () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))

    render(<PedagogicalReportPanel courseId="c-1" />)

    const failed = screen.getByRole("row", { name: /Reprobados/ })
    expect(failed).toHaveTextContent("2")
    expect(failed).toHaveTextContent("1")
    expect(failed).toHaveTextContent("3")
    expect(failed).toHaveTextContent("13,64")
  })

  /** Las áreas van apiladas en una celda: el documento de la escuela las imprime así. */
  it("apila las áreas reprobadas de un estudiante con su nota", () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(screen.getByText(/Matemática/)).toHaveTextContent("45")
    expect(screen.getByText(/Lengua/)).toHaveTextContent("48")
  })

  /** Un informe que nadie escribió todavía es la hoja en blanco, no un error ni un vacío. */
  it("abre la hoja aunque nadie la haya escrito", () => {
    usePedagogicalReport.mockReturnValue(
      query({
        data: sheet({ exists: false, achievements: null, difficulties: null }),
      })
    )

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByLabelText(/Logros/)).toHaveValue("")
    expect(screen.getByText(/Sin guardar/)).toBeInTheDocument()
  })

  /**
   * El formulario tiene las dos mitades a la vista, así que siempre manda las dos. Mandar sólo la
   * prosa dejaría intacta la sección IV, pero el docente acaba de editarla en la misma pantalla.
   */
  it("guarda la prosa y la sección IV en el mismo PUT", async () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))
    const user = userEvent.setup()

    render(<PedagogicalReportPanel courseId="c-1" />)

    await user.clear(screen.getByLabelText(/Logros/))
    await user.type(screen.getByLabelText(/Logros/), "Avanzaron.")
    await user.click(screen.getByRole("button", { name: /Guardar/ }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith({
      courseId: "c-1",
      trimester: 1,
      payload: {
        achievements: "Avanzaron.",
        difficulties: "Les cuesta la división.",
        failingStudents: [
          {
            idCourseEnrollment: "ce-1",
            actions: "Refuerzo los martes.",
            verificationSource: "Cuaderno de refuerzo.",
          },
        ],
      },
    })
  })

  /** Una caja vaciada es un null, no un `""`: la columna es nullable y así queda como estaba. */
  it("manda null por la caja que el docente vació", async () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))
    const user = userEvent.setup()

    render(<PedagogicalReportPanel courseId="c-1" />)

    await user.clear(screen.getByLabelText(/Dificultades/))
    await user.click(screen.getByRole("button", { name: /Guardar/ }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate.mock.calls[0][0].payload.difficulties).toBeNull()
  })

  /** Dos clics seguidos son dos PUT sobre el mismo documento; el segundo pisa al primero. */
  it("no deja guardar dos veces mientras el guardado está en vuelo", () => {
    usePedagogicalReport.mockReturnValue(query({ data: sheet() }))
    useSavePedagogicalReport.mockReturnValue({ mutate, isPending: true })

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled()
  })

  /**
   * El curso sin reprobados no es un curso sin informe: sus dos cajas de prosa se escriben igual, y
   * la sección IV queda con su leyenda en vez de una tabla de encabezados sin filas.
   */
  it("dice que no hay reprobados en vez de dibujar una tabla vacía", () => {
    usePedagogicalReport.mockReturnValue(
      query({ data: sheet({ failingStudents: [] }) })
    )

    render(<PedagogicalReportPanel courseId="c-1" />)

    expect(screen.getByText(/Ningún estudiante reprobó/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Logros/)).toBeInTheDocument()
  })
})
