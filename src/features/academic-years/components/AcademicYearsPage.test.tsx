import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

import { AcademicYearsPage } from "./AcademicYearsPage"

vi.mock("./NewAcademicYearButton", () => ({
  NewAcademicYearButton: () => <button>Nueva gestión</button>,
}))
vi.mock("./AcademicYearsTable", () => ({ AcademicYearsTable: () => null }))

describe("AcademicYearsPage, header by role", () => {
  beforeEach(() => {
    useAuthStore.setState({ role: "DIRECTOR" })
  })

  it("offers the Director the new year", () => {
    render(<AcademicYearsPage />)
    expect(
      screen.getByRole("button", { name: "Nueva gestión" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Crea, activa, cierra o reabre/)
    ).toBeInTheDocument()
  })

  // The API opens POST /academic-years to the secretariat; activate, close and reopen stay closed.
  it("offers the Secretary the new year, and keeps the rest to the Director", () => {
    useAuthStore.setState({ role: "SECRETARY" })
    render(<AcademicYearsPage />)
    expect(
      screen.getByRole("button", { name: "Nueva gestión" })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/activa, cierra o reabre/)
    ).not.toBeInTheDocument()
  })

  it("offers a Teacher nothing", () => {
    useAuthStore.setState({ role: "TEACHER" })
    render(<AcademicYearsPage />)
    expect(
      screen.queryByRole("button", { name: "Nueva gestión" })
    ).not.toBeInTheDocument()
  })
})
