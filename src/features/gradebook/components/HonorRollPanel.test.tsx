import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  CourseHonorRollPanel,
  InstitutionHonorRollPanel,
} from "./HonorRollPanel"

const useHonorRoll = vi.hoisted(() => vi.fn())
const useInstitutionHonorRoll = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({
  useHonorRoll,
  useInstitutionHonorRoll,
}))

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...over,
})

const entry = {
  position: 1,
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Quispe Ana",
  courseId: "c-1",
  gradeName: "Quinto",
  parallelName: "B",
  finalAverage: 95,
}

describe("CourseHonorRollPanel", () => {
  /**
   * "Sin estudiantes calificados" es una respuesta sobre el curso; un fetch caído no dice nada.
   * Mostrar la misma tabla vacía en los dos casos le diría al docente que su curso está sin notas.
   */
  it("dice que el podio falló en vez de dibujar uno vacío", () => {
    useHonorRoll.mockReturnValue(query({ isError: true }))

    render(<CourseHonorRollPanel courseId="c-1" places={3} />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByText(/Sin estudiantes/)).not.toBeInTheDocument()
  })

  it("dibuja el podio cuando llega", () => {
    useHonorRoll.mockReturnValue(query({ data: [entry] }))

    render(<CourseHonorRollPanel courseId="c-1" places={3} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
  })

  it("no pide nada sin curso elegido", () => {
    useHonorRoll.mockReturnValue(query())

    render(<CourseHonorRollPanel courseId={null} places={3} />)

    expect(screen.getByText(/Selecciona un curso/)).toBeInTheDocument()
  })
})

describe("InstitutionHonorRollPanel", () => {
  it("dice que el podio falló en vez de dibujar uno vacío", () => {
    useInstitutionHonorRoll.mockReturnValue(query({ isError: true }))

    render(<InstitutionHonorRollPanel academicYearId={7} places={10} />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
  })

  /** El aula es lo único que distingue a dos estudiantes del mismo nombre en un edificio entero. */
  it("nombra el aula de cada estudiante", () => {
    useInstitutionHonorRoll.mockReturnValue(query({ data: [entry] }))

    render(<InstitutionHonorRollPanel academicYearId={7} places={10} />)

    expect(screen.getByText("Quinto B")).toBeInTheDocument()
  })

  it("no pide nada sin gestión activa", () => {
    useInstitutionHonorRoll.mockReturnValue(query())

    render(<InstitutionHonorRollPanel academicYearId={null} places={10} />)

    expect(screen.getByText(/Sin gestión activa/)).toBeInTheDocument()
  })
})
