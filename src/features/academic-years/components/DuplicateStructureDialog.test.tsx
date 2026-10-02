import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const duplicateStructure = vi.hoisted(() => vi.fn())

vi.mock("../services/academicYearService", () => ({
  AcademicYearService: { duplicateStructure },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { DuplicateStructureDialog } from "./DuplicateStructureDialog"

const ACTIVE = { id: 1, year: 2026, active: true, closed: false }
const TARGET = { id: 2, year: 2027, active: false, closed: false }
const CLOSED = { id: 3, year: 2025, active: false, closed: true }
const YEARS = [TARGET, ACTIVE, CLOSED]

const SUMMARY = {
  coursesCreated: 3,
  coursesSkipped: 2,
  classGroupsCreated: 27,
  skippedCourses: ["Primero A", "Segundo B"],
}

let qc: QueryClient
const onClose = vi.fn()

function wrap(target: typeof TARGET | null, years: (typeof TARGET)[]) {
  return (
    <QueryClientProvider client={qc}>
      <DuplicateStructureDialog
        target={target}
        years={years}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
}

function renderDialog(target = TARGET, years = YEARS) {
  render(wrap(target, years))
}

const confirm = () => screen.getByRole("button", { name: "Duplicar" })
const sourceSelect = () => screen.getByRole("combobox", { name: "Gestión" })

beforeEach(() => {
  vi.clearAllMocks()
  duplicateStructure.mockResolvedValue(SUMMARY)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("DuplicateStructureDialog", () => {
  it("names the target and explains what is and is not copied", () => {
    renderDialog()

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("2027")
    expect(dialog).toHaveTextContent(
      /copia los cursos activos y sus materias, sin docentes ni docente de aula/i
    )
    expect(dialog).toHaveTextContent(/puedes repetirlo/i)
  })

  it("starts from the active year when it is not the target", () => {
    renderDialog()

    expect(sourceSelect()).toHaveTextContent("Gestión 2026")
  })

  it("starts from the newest other year when the target is the active one", () => {
    renderDialog(ACTIVE, YEARS)

    expect(sourceSelect()).toHaveTextContent("Gestión 2027")
  })

  it("never offers the target as its own source", async () => {
    renderDialog()

    await userEvent.click(sourceSelect())

    const options = (await screen.findAllByRole("option")).map(
      (o) => o.textContent
    )
    expect(options).toEqual(["Gestión 2026", "Gestión 2025 (cerrada)"])
  })

  it("sends the target and the chosen source", async () => {
    renderDialog()
    await userEvent.click(sourceSelect())
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2025 (cerrada)" })
    )

    await userEvent.click(confirm())

    await waitFor(() => expect(duplicateStructure).toHaveBeenCalledWith(2, 3))
  })

  it("shows what the copy did, with the names of the courses it skipped", async () => {
    renderDialog()

    await userEvent.click(confirm())

    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(dialog).toHaveTextContent(/cursos creados:s*3/i))
    expect(dialog).toHaveTextContent(/materias abiertas:s*27/i)
    expect(dialog).toHaveTextContent(/cursos que ya existían:s*2/i)
    expect(
      within(dialog)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["Primero A", "Segundo B"])
    expect(
      within(dialog).queryByRole("button", { name: "Duplicar" })
    ).not.toBeInTheDocument()
  })

  it("lists no skipped courses when none was skipped", async () => {
    duplicateStructure.mockResolvedValue({
      ...SUMMARY,
      coursesSkipped: 0,
      skippedCourses: [],
    })
    renderDialog()

    await userEvent.click(confirm())

    await screen.findByText(/cursos creados:/i)
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
  })

  it("closes from the summary", async () => {
    renderDialog()
    await userEvent.click(confirm())

    const dialog = await screen.findByRole("dialog")
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "Cerrar" })
    )

    expect(onClose).toHaveBeenCalled()
  })

  it("keeps the form and shows no summary when the API refuses", async () => {
    duplicateStructure.mockRejectedValue(new Error("409"))
    renderDialog()

    await userEvent.click(confirm())

    await waitFor(() => expect(duplicateStructure).toHaveBeenCalled())
    expect(screen.queryByText(/cursos creados/i)).not.toBeInTheDocument()
    await waitFor(() => expect(confirm()).toBeEnabled())
  })

  it("disables its buttons while the copy is in flight", async () => {
    duplicateStructure.mockReturnValue(new Promise(() => {}))
    renderDialog()

    await userEvent.click(confirm())

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /duplicando/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    })
  })

  it("has nothing to copy from when the target is the only year", () => {
    renderDialog(TARGET, [TARGET])

    expect(screen.getByText(/no hay otra gestión/i)).toBeInTheDocument()
    expect(confirm()).toBeDisabled()
  })

  it("renders nothing without a target", () => {
    render(wrap(null, YEARS))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
