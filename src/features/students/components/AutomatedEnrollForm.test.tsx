import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const parseStudentsPdf = vi.hoisted(() => vi.fn())
const parseNominaXlsx = vi.hoisted(() => vi.fn())
const mutateAsync = vi.hoisted(() => vi.fn())
const useCourseOverview = vi.hoisted(() => vi.fn())

// Reading the file is pdfjs's job; these tests are about what the form does with what it read.
vi.mock("../services/studentPdfService", () => ({ parseStudentsPdf }))
vi.mock("../services/studentXlsxService", () => ({ parseNominaXlsx }))
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

describe("AutomatedEnrollForm with the SIE list of the whole school", () => {
  const schoolRoster = (year = 2026) => ({
    year,
    blocks: [
      {
        grade: "Primero",
        parallel: "A",
        rows: [{ ...student, fullName: "OTRO CURSO LUIS" }],
      },
      { grade: "Segundo", parallel: "A", rows: [student] },
    ],
  })

  it("enrols only the block of the teacher's course, with every field", async () => {
    parseStudentsPdf.mockResolvedValueOnce(schoolRoster())

    await upload()
    await userEvent.click(
      await screen.findByRole("button", { name: /inscribir 1 estudiantes/i })
    )

    expect(mutateAsync).toHaveBeenCalledWith({
      id_course: "c-1",
      students: [
        {
          names: "ANA",
          lastNames: "PEREZ ROJAS",
          rudeCode: "1234567890123",
          identityCard: "9876543",
          birthDate: "2018-03-05",
          gender: "F",
        },
      ],
    })
  })

  it("names the courses it found when the teacher's is missing", async () => {
    parseStudentsPdf.mockResolvedValueOnce({
      year: 2026,
      blocks: [{ grade: "Inicial", parallel: "A", rows: [student] }],
    })

    await upload()

    expect(
      await screen.findByText(
        "La nómina del SIE no tiene el curso Segundo A. Cursos encontrados: Inicial A."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /inscribir/i })).toBeDisabled()
  })

  it("refuses a list of another gestion and calls nothing", async () => {
    parseStudentsPdf.mockResolvedValueOnce(schoolRoster(2025))

    await upload()

    expect(
      await screen.findByText(
        "Esta nómina no corresponde a tu curso (Segundo A 2025 ≠ Segundo A 2026)."
      )
    ).toBeInTheDocument()
    const submit = screen.getByRole("button", { name: /inscribir/i })
    expect(submit).toBeDisabled()
    await userEvent.click(submit)
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const uploadXlsx = async (file = new File(["PK"], "nomina.xlsx")) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AutomatedEnrollForm courseId="c-1" onSuccess={vi.fn()} />
    </QueryClientProvider>
  )
  await userEvent.upload(screen.getByLabelText(/subir nómina pdf/i), file)
}

const nameOnly = {
  rowIndex: 1,
  rawFullName: "PEREZ ROJAS ANA",
  fullName: "PEREZ ROJAS ANA",
  lastNames: "PEREZ ROJAS",
  names: "ANA",
}

describe("AutomatedEnrollForm with the school's xlsx", () => {
  it("accepts both a PDF and an xlsx", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AutomatedEnrollForm courseId="c-1" onSuccess={vi.fn()} />
      </QueryClientProvider>
    )

    const accept = screen
      .getByLabelText(/subir nómina pdf/i)
      .getAttribute("accept")
    expect(accept).toContain("application/pdf")
    expect(accept).toContain(".xlsx")
    expect(accept).toContain(XLSX_TYPE)
  })

  it("reads an xlsx with the workbook parser, not pdfjs", async () => {
    parseNominaXlsx.mockResolvedValueOnce([
      { grade: "Segundo", parallel: "A", rows: [nameOnly], rejected: [] },
    ])

    await uploadXlsx(new File(["PK"], "NOMINA.XLSX", { type: XLSX_TYPE }))

    expect(await screen.findByText("PEREZ ROJAS")).toBeInTheDocument()
    expect(parseNominaXlsx).toHaveBeenCalledOnce()
    expect(parseStudentsPdf).not.toHaveBeenCalled()
  })

  it("enrols only the block of the selected course, with names only", async () => {
    parseNominaXlsx.mockResolvedValueOnce([
      {
        grade: "Primero",
        parallel: "A",
        rows: [{ ...nameOnly, fullName: "OTRO CURSO LUIS" }],
        rejected: [],
      },
      { grade: "Segundo", parallel: "A", rows: [nameOnly], rejected: [] },
    ])

    await uploadXlsx()
    expect(
      await screen.findByText(/puedes completarlos después/i)
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: /inscribir 1 estudiantes/i })
    )

    expect(mutateAsync).toHaveBeenCalledWith({
      id_course: "c-1",
      students: [{ names: "ANA", lastNames: "PEREZ ROJAS" }],
    })
  })

  it("names the courses it found when the selected one is missing", async () => {
    parseNominaXlsx.mockResolvedValueOnce([
      { grade: "Inicial", parallel: "A", rows: [nameOnly], rejected: [] },
    ])

    await uploadXlsx()

    expect(
      await screen.findByText(
        "La planilla no tiene el curso Segundo A. Cursos encontrados: Inicial A."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /inscribir/i })).toBeDisabled()
  })

  it("shows the rows it could not split", async () => {
    parseNominaXlsx.mockResolvedValueOnce([
      {
        grade: "Segundo",
        parallel: "A",
        rows: [nameOnly],
        rejected: [
          { rowNumber: 9, rawFullName: "SOLO", reason: "Una palabra." },
        ],
      },
    ])

    await uploadXlsx()

    expect(
      await screen.findByText("Fila 9 omitida (SOLO): Una palabra.")
    ).toBeInTheDocument()
  })

  it("refuses a file that is neither a PDF nor an xlsx", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AutomatedEnrollForm courseId="c-1" onSuccess={vi.fn()} />
      </QueryClientProvider>
    )
    await userEvent.upload(
      screen.getByLabelText(/subir nómina pdf/i),
      new File(["x"], "nomina.docx"),
      { applyAccept: false }
    )

    expect(
      await screen.findByText(
        "Formato no soportado. Sube la nómina en PDF o Excel (.xlsx)."
      )
    ).toBeInTheDocument()
  })
})
