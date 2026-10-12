import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const parseStudentsPdf = vi.hoisted(() => vi.fn())
const mutateAsync = vi.hoisted(() => vi.fn())
const useCourseOverview = vi.hoisted(() => vi.fn())

// Reading the file is pdfjs's job; these tests are about what the form does with what it read.
vi.mock("../services/studentPdfService", () => ({ parseStudentsPdf }))
vi.mock("../hooks/useEnroll", () => ({
  useEnrollBatch: () => ({ mutateAsync, isPending: false }),
}))
vi.mock("@/features/courses/hooks/useCourses", () => ({ useCourseOverview }))

import { AutomatedEnrollForm } from "./AutomatedEnrollForm"

const student = {
  rowIndex: 1,
  rudeCode: "1234567890123",
  identityCard: "9876543",
  names: "ANA",
  lastNames: "PEREZ ROJAS",
  rawFullName: "PEREZ ROJAS ANA",
  fullName: "PEREZ ROJAS ANA",
  birthDate: "2018-03-05",
  gender: "F" as const,
}

const upload = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AutomatedEnrollForm courseId="c-1" onSuccess={vi.fn()} />
    </QueryClientProvider>
  )
  await userEvent.upload(
    screen.getByLabelText(/subir nómina pdf/i),
    new File(["%PDF"], "nomina.pdf", { type: "application/pdf" })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useCourseOverview.mockReturnValue({
    data: {
      course: { gradeName: "Segundo", parallelName: "A", year: 2026 },
    },
  })
})

describe("AutomatedEnrollForm", () => {
  it("enrols the roster of the teacher's own course", async () => {
    parseStudentsPdf.mockResolvedValueOnce({
      header: { grade: "Segundo", parallel: "A", year: 2026 },
      rows: [student],
    })

    await upload()
    await userEvent.click(
      await screen.findByRole("button", { name: /inscribir 1 estudiantes/i })
    )

    expect(mutateAsync).toHaveBeenCalledOnce()
  })

  it("refuses a roster of another course and calls nothing", async () => {
    parseStudentsPdf.mockResolvedValueOnce({
      header: { grade: "Tercero", parallel: "A", year: 2026 },
      rows: [student],
    })

    await upload()

    expect(
      await screen.findByText(
        "Esta nómina no corresponde a tu curso (Tercero A 2026 ≠ Segundo A 2026)."
      )
    ).toBeInTheDocument()
    const submit = screen.getByRole("button", { name: /inscribir/i })
    expect(submit).toBeDisabled()
    await userEvent.click(submit)
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("refuses a roster whose header it could not read", async () => {
    parseStudentsPdf.mockResolvedValueOnce({ header: null, rows: [student] })

    await upload()

    expect(
      await screen.findByText(
        "No se pudo leer el curso y paralelo de la nómina; verifica que sea la nómina oficial."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /inscribir/i })).toBeDisabled()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  // Without the course there is nothing to compare against, so nothing may go out.
  it("holds the import while the course has not loaded", async () => {
    useCourseOverview.mockReturnValue({ data: undefined })
    parseStudentsPdf.mockResolvedValueOnce({
      header: { grade: "Segundo", parallel: "A", year: 2026 },
      rows: [student],
    })

    await upload()

    const submit = await screen.findByRole("button", {
      name: /inscribir 1 estudiantes/i,
    })
    expect(submit).toBeDisabled()
  })
})
