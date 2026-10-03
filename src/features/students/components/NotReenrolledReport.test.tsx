import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useNotReenrolled = vi.hoisted(() => vi.fn())
const useAcademicYears = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useStudent", () => ({ useNotReenrolled }))
vi.mock("@/features/catalog/hooks/useCatalog", () => ({ useAcademicYears }))

import { NotReenrolledReport } from "./NotReenrolledReport"
import type { NotReenrolledResponse } from "../models/response/not-reenrolled-response"

const refetch = vi.fn()

const report = (
  over: Partial<NotReenrolledResponse> = {}
): NotReenrolledResponse => ({
  academicYear: { id: 8, year: 2026 },
  previousYear: { id: 7, year: 2025 },
  students: [
    {
      studentId: "s-1",
      rudeCode: "RUDE-1",
      identityCard: "1111111",
      fullName: "Ana Quispe",
      status: "Effective",
      lastCourse: {
        id: "c-1",
        name: "Primero A",
        grade: "Primero",
        parallel: "A",
      },
    },
    {
      studentId: "s-2",
      rudeCode: "RUDE-2",
      identityCard: "2222222",
      fullName: "Luis Mamani",
      status: "Withdrawn",
      lastCourse: {
        id: "c-2",
        name: "Segundo B",
        grade: "Segundo",
        parallel: "B",
      },
    },
  ],
  ...over,
})

const loaded = (data: NotReenrolledResponse) => ({
  data,
  isLoading: false,
  isError: false,
  refetch,
})

beforeEach(() => {
  vi.clearAllMocks()
  useAcademicYears.mockReturnValue({
    data: [
      { id: 8, year: 2026 },
      { id: 7, year: 2025 },
    ],
  })
  useNotReenrolled.mockReturnValue(loaded(report()))
})

describe("NotReenrolledReport", () => {
  it("asks for the active year when none is chosen", () => {
    render(<NotReenrolledReport />)

    expect(useNotReenrolled).toHaveBeenCalledWith(undefined)
  })

  it("lists each student with the course they last attended", () => {
    render(<NotReenrolledReport />)

    expect(screen.getByText("Ana Quispe")).toBeInTheDocument()
    expect(screen.getByText("Primero A")).toBeInTheDocument()
    expect(screen.getByText("RUDE-1")).toBeInTheDocument()
    expect(screen.getByText("1111111")).toBeInTheDocument()
  })

  it("puts the head count in the header", () => {
    render(<NotReenrolledReport />)

    expect(screen.getByText(/2 estudiantes/)).toBeInTheDocument()
  })

  it("says estudiante in the singular for one student", () => {
    useNotReenrolled.mockReturnValue(
      loaded(report({ students: report().students.slice(0, 1) }))
    )
    render(<NotReenrolledReport />)

    expect(screen.getByText("1 estudiante")).toBeInTheDocument()
  })

  it("does not repeat the count line when nobody is missing", () => {
    useNotReenrolled.mockReturnValue(loaded(report({ students: [] })))
    render(<NotReenrolledReport />)

    expect(screen.queryByText(/no tienen curso/)).not.toBeInTheDocument()
  })

  /** Only a withdrawn student carries the badge; the other has simply not come back. */
  it("marks the withdrawn student, and only that one", () => {
    render(<NotReenrolledReport />)

    expect(screen.getAllByText("Retirado")).toHaveLength(1)
  })

  it("shows a spinner while loading, not an empty list", () => {
    useNotReenrolled.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch,
    })
    render(<NotReenrolledReport />)

    expect(screen.getByText(/Cargando/)).toBeInTheDocument()
    expect(screen.queryByText(/ya tienen curso/)).not.toBeInTheDocument()
  })

  /** A failed fetch must never read as "nobody is missing". */
  it("says the fetch failed instead of showing an empty list", async () => {
    useNotReenrolled.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })
    render(<NotReenrolledReport />)

    expect(screen.getByText(/No se pudo cargar el reporte/)).toBeInTheDocument()
    expect(screen.queryByText(/ya tienen curso/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("says so when every student of the previous year came back", () => {
    useNotReenrolled.mockReturnValue(loaded(report({ students: [] })))
    render(<NotReenrolledReport />)

    expect(screen.getByText(/ya tienen curso/)).toBeInTheDocument()
  })

  it("says there is no previous year when the API has none", () => {
    useNotReenrolled.mockReturnValue(
      loaded(report({ previousYear: null, students: [] }))
    )
    render(<NotReenrolledReport />)

    expect(
      screen.getByText(/no hay gestión anterior registrada/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/ya tienen curso/)).not.toBeInTheDocument()
  })

  it("asks for the chosen year", async () => {
    render(<NotReenrolledReport />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "2025" }))

    expect(useNotReenrolled).toHaveBeenLastCalledWith(7)
  })
})
