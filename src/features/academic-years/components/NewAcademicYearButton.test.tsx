import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const years = vi.hoisted(() => vi.fn())
const create = vi.hoisted(() => vi.fn())

vi.mock("@/features/catalog/services/catalogService", () => ({
  CatalogService: { academicYears: years },
}))
vi.mock("../services/academicYearService", () => ({
  AcademicYearService: { create },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { NewAcademicYearButton } from "./NewAcademicYearButton"

const Y2026 = { id: 1, year: 2026, active: true, closed: false }
const Y2025 = { id: 3, year: 2025, active: false, closed: true }

let qc: QueryClient

function renderButton() {
  render(
    <QueryClientProvider client={qc}>
      <NewAcademicYearButton />
    </QueryClientProvider>
  )
}

async function openDialog() {
  // Disabled until the year list is known: the proposed year is derived from it.
  const button = screen.getByRole("button", { name: "Nueva gestión" })
  await waitFor(() => expect(button).toBeEnabled())
  await userEvent.click(button)
  return screen.findByRole("dialog")
}

beforeEach(() => {
  vi.clearAllMocks()
  years.mockResolvedValue([Y2026, Y2025])
  create.mockResolvedValue({
    year: { id: 9, year: 2027, active: false, closed: false },
    created: true,
  })
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("NewAcademicYearButton", () => {
  it("proposes the year after the latest existing one", async () => {
    renderButton()

    await openDialog()

    expect(await screen.findByLabelText("Año")).toHaveValue(2027)
  })

  it("creates the year it shows and closes", async () => {
    renderButton()
    await openDialog()

    await userEvent.click(screen.getByRole("button", { name: "Crear gestión" }))

    await waitFor(() => expect(create).toHaveBeenCalledWith(2027))
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
  })

  it("sends the year the Director typed", async () => {
    renderButton()
    await openDialog()

    const input = await screen.findByLabelText("Año")
    await userEvent.clear(input)
    await userEvent.type(input, "2030")
    await userEvent.click(screen.getByRole("button", { name: "Crear gestión" }))

    await waitFor(() => expect(create).toHaveBeenCalledWith(2030))
  })

  it.each(["1999", "2101", ""])(
    "will not submit %j and says why",
    async (text) => {
      renderButton()
      await openDialog()

      const input = await screen.findByLabelText("Año")
      await userEvent.clear(input)
      if (text) await userEvent.type(input, text)

      expect(
        screen.getByRole("button", { name: "Crear gestión" })
      ).toBeDisabled()
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(create).not.toHaveBeenCalled()
    }
  )

  it("disables both buttons while the creation is in flight", async () => {
    create.mockReturnValue(new Promise(() => {}))
    renderButton()
    await openDialog()

    await userEvent.click(screen.getByRole("button", { name: "Crear gestión" }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /creando|crear gestión/i })
      ).toBeDisabled()
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    })
  })
})
