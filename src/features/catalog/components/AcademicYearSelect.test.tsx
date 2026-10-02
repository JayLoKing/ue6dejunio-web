import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AcademicYearSelect } from "./AcademicYearSelect"

const years = [
  { id: 1, year: 2025, active: false, closed: true },
  { id: 2, year: 2026, active: true, closed: false },
]

describe("AcademicYearSelect", () => {
  it("shows the chosen year and marks closed ones in the list", async () => {
    render(<AcademicYearSelect years={years} value={2} onChange={vi.fn()} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("Gestión 2026")
    await userEvent.click(screen.getByRole("combobox"))
    expect(
      await screen.findByRole("option", { name: "Gestión 2025 (cerrada)" })
    ).toBeInTheDocument()
  })

  it("reports the picked year id", async () => {
    const onChange = vi.fn()
    render(<AcademicYearSelect years={years} value={2} onChange={onChange} />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2025 (cerrada)" })
    )
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it("falls back to the placeholder when nothing is chosen", () => {
    render(<AcademicYearSelect years={years} value={null} onChange={vi.fn()} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("Elige una gestión")
  })
})
