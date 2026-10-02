import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const years = vi.hoisted(() => vi.fn())
const activate = vi.hoisted(() => vi.fn())
const close = vi.hoisted(() => vi.fn())
const reopen = vi.hoisted(() => vi.fn())

vi.mock("@/features/catalog/services/catalogService", () => ({
  CatalogService: { academicYears: years },
}))
vi.mock("../services/academicYearService", () => ({
  AcademicYearService: { activate, close, reopen },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { AcademicYearsTable } from "./AcademicYearsTable"

const ACTIVE = { id: 1, year: 2026, active: true, closed: false }
const OPEN = { id: 2, year: 2027, active: false, closed: false }
const CLOSED = { id: 3, year: 2025, active: false, closed: true }

let qc: QueryClient

function renderTable() {
  render(
    <QueryClientProvider client={qc}>
      <AcademicYearsTable />
    </QueryClientProvider>
  )
}

const rowOf = async (year: number) =>
  within(
    (await screen.findByRole("cell", { name: String(year) })).closest(
      "tr"
    ) as HTMLElement
  )

beforeEach(() => {
  vi.clearAllMocks()
  years.mockResolvedValue([OPEN, ACTIVE, CLOSED])
  activate.mockResolvedValue(OPEN)
  close.mockResolvedValue(ACTIVE)
  reopen.mockResolvedValue(CLOSED)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("AcademicYearsTable", () => {
  it("labels each year with its state", async () => {
    renderTable()

    const active = await rowOf(2026)
    expect(active.getByText("Activa")).toBeInTheDocument()
    expect(active.getByText("Abierta")).toBeInTheDocument()
    expect((await rowOf(2027)).queryByText("Activa")).not.toBeInTheDocument()
    expect((await rowOf(2025)).getByText("Cerrada")).toBeInTheDocument()
  })

  it("enables only the actions that make sense for each state", async () => {
    renderTable()

    const open = await rowOf(2027)
    expect(open.getByRole("button", { name: "Activar" })).toBeEnabled()
    expect(open.getByRole("button", { name: "Cerrar" })).toBeEnabled()
    expect(open.getByRole("button", { name: "Reabrir" })).toBeDisabled()

    const active = await rowOf(2026)
    expect(active.getByRole("button", { name: "Activar" })).toBeDisabled()
    expect(active.getByRole("button", { name: "Cerrar" })).toBeEnabled()
    expect(active.getByRole("button", { name: "Reabrir" })).toBeDisabled()

    const closed = await rowOf(2025)
    expect(closed.getByRole("button", { name: "Activar" })).toBeDisabled()
    expect(closed.getByRole("button", { name: "Cerrar" })).toBeDisabled()
    expect(closed.getByRole("button", { name: "Reabrir" })).toBeEnabled()
  })

  it("activates straight away, with no confirmation", async () => {
    renderTable()

    await userEvent.click(
      (await rowOf(2027)).getByRole("button", { name: "Activar" })
    )

    await waitFor(() => expect(activate).toHaveBeenCalledWith(2))
  })

  it("asks before closing, warns what closing does, and closes only on confirm", async () => {
    renderTable()

    await userEvent.click(
      (await rowOf(2026)).getByRole("button", { name: "Cerrar" })
    )

    const dialog = await screen.findByRole("alertdialog")
    expect(close).not.toHaveBeenCalled()
    expect(dialog).toHaveTextContent(/congela/i)
    expect(dialog).toHaveTextContent(/ninguna gestión quedará activa/i)

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Cerrar gestión" })
    )

    await waitFor(() => expect(close).toHaveBeenCalledWith(1))
  })

  it("does not warn about the active year when closing one that is not", async () => {
    renderTable()

    await userEvent.click(
      (await rowOf(2027)).getByRole("button", { name: "Cerrar" })
    )

    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).not.toHaveTextContent(/ninguna gestión quedará activa/i)
  })

  it("does nothing when the closing is cancelled", async () => {
    renderTable()

    await userEvent.click(
      (await rowOf(2027)).getByRole("button", { name: "Cerrar" })
    )
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancelar",
      })
    )

    expect(close).not.toHaveBeenCalled()
  })

  it("asks before reopening and reopens only on confirm", async () => {
    renderTable()

    await userEvent.click(
      (await rowOf(2025)).getByRole("button", { name: "Reabrir" })
    )

    const dialog = await screen.findByRole("alertdialog")
    expect(reopen).not.toHaveBeenCalled()

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Reabrir gestión" })
    )

    await waitFor(() => expect(reopen).toHaveBeenCalledWith(3))
  })

  it("refetches the year list and the courses after a success", async () => {
    renderTable()
    await rowOf(2027)
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    await userEvent.click(
      (await rowOf(2027)).getByRole("button", { name: "Activar" })
    )

    await waitFor(() => {
      const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey)
      expect(keys).toContainEqual(["catalog", "academic-years"])
      expect(keys).toContainEqual(expect.arrayContaining(["courses"]))
    })
  })

  it("disables the actions while one is in flight", async () => {
    activate.mockReturnValue(new Promise(() => {}))
    renderTable()

    await userEvent.click(
      (await rowOf(2027)).getByRole("button", { name: "Activar" })
    )

    await waitFor(async () => {
      expect(
        (await rowOf(2027)).getByRole("button", { name: "Cerrar" })
      ).toBeDisabled()
      expect(
        (await rowOf(2025)).getByRole("button", { name: "Reabrir" })
      ).toBeDisabled()
    })
  })

  it("says the list failed instead of claiming there are no years", async () => {
    years.mockRejectedValue(new Error("boom"))
    renderTable()

    expect(
      await screen.findByText(/no se pudieron cargar las gestiones/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/sin gestiones/i)).not.toBeInTheDocument()
  })

  it("says there are no years only when the list really is empty", async () => {
    years.mockResolvedValue([])
    renderTable()

    expect(await screen.findByText(/sin gestiones/i)).toBeInTheDocument()
  })
})
