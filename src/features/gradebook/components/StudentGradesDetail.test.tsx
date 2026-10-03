import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const studentSummary = vi.hoisted(() => vi.fn())
const enrollmentScores = vi.hoisted(() => vi.fn())

vi.mock("../services/gradebookService", () => ({
  GradebookService: { studentSummary, enrollmentScores },
}))
// El selector de trimestre es asunto de otro test; acá sólo estorba.
vi.mock("@/components/shared/TrimesterSelect", () => ({
  TrimesterSelect: () => null,
}))

import { StudentGradesDetail } from "./StudentGradesDetail"

const summary = {
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Ana Quispe",
  trimester: 1,
  generalAverage: 72.5,
  subjects: [
    {
      classGroupId: "cg-1",
      subjectName: "Computación",
      total: 80,
      graded: true,
    },
  ],
}

function renderDetail(ownSubjectsOnly?: boolean) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={qc}>
      <StudentGradesDetail
        courseEnrollmentId="ce-1"
        ownSubjectsOnly={ownSubjectsOnly}
      />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  studentSummary.mockResolvedValue(summary)
  enrollmentScores.mockResolvedValue([])
})

describe("StudentGradesDetail para quien dicta una sola materia del curso", () => {
  it("no pide el consolidado por dimensión, que es del docente de aula", async () => {
    renderDetail(true)

    await screen.findByText("Computación")
    expect(enrollmentScores).not.toHaveBeenCalled()
  })

  it("muestra solo las materias devueltas y el promedio general real", async () => {
    renderDetail(true)

    expect(await screen.findByText("Computación")).toBeInTheDocument()
    expect(screen.getByText("80.0")).toBeInTheDocument()
    expect(screen.getByText("72.50")).toBeInTheDocument()
    expect(screen.getByText(/Promedio general/)).toBeInTheDocument()
  })

  it("avisa que ve solo sus materias", async () => {
    renderDetail(true)

    expect(
      await screen.findByText(/ves solo tus materias/i)
    ).toBeInTheDocument()
  })

  it("dice que falló la carga en lugar de leerse como sin materias", async () => {
    studentSummary.mockRejectedValue(new Error("boom"))
    renderDetail(true)

    expect(
      await screen.findByText(/no se pudo cargar el detalle/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/sin materias/i)).not.toBeInTheDocument()
  })
})

describe("StudentGradesDetail para Dirección y el docente de aula", () => {
  it("sigue pidiendo el consolidado por dimensión y no muestra el aviso", async () => {
    enrollmentScores.mockResolvedValue([
      {
        id: "s1",
        trimester: 1,
        subjectName: "Matemática",
        scoreBeing: 8,
        scoreKnowing: 40,
        scoreDoing: 30,
        scoreDeciding: 4,
        totalScore: 82,
      },
    ])
    renderDetail()

    expect(await screen.findByText("Matemática")).toBeInTheDocument()
    expect(enrollmentScores).toHaveBeenCalledWith("ce-1")
    expect(screen.queryByText(/ves solo tus materias/i)).not.toBeInTheDocument()
  })
})
