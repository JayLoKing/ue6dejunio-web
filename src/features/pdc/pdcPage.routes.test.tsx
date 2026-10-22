/**
 * Who may open a plan's progress from the PDC listing, and what they get. The teacher reports it;
 * the Director only follows it, so they get the history without the form.
 * Lives outside `src/routes` on purpose: the router plugin reads every file there as a route.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"
import type { Pdc, PdcStatus } from "@/features/pdc/types"

const rows = vi.hoisted(() => ({ current: [] as unknown[] }))
const copy = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))

vi.mock("@/features/pdc/hooks/usePdc", () => ({
  usePdcList: () => ({
    data: {
      content: rows.current,
      page: 0,
      total: rows.current.length,
      totalPages: 1,
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  usePdcAction: () => ({
    publish: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), isPending: false },
  }),
  usePdcProgress: () => ({
    isLoading: false,
    isError: false,
    data: [
      {
        id: "e-1",
        pdcId: "p-1",
        progressDate: "2026-05-04",
        advancedContent: "Fracciones equivalentes",
        percentage: 40,
        observations: null,
      },
    ],
  }),
  useAddProgress: () => ({ mutate: vi.fn(), isPending: false }),
  useCopyPdcToParallels: () => copy,
}))

vi.mock("@/features/courses/hooks/useCourses", () => ({
  useTeacherClassGroups: () => ({ data: [] }),
}))

// The document, the wizard and the create dialog are other tests' business.
vi.mock("@/features/pdc/components/PdcReviewDialog", () => ({
  PdcReviewDialog: () => null,
}))
vi.mock("@/features/pdc/components/PdcWizard", () => ({
  PdcWizard: () => null,
}))
vi.mock("@/features/pdc/components/PdcCreateDialog", () => ({
  PdcCreateDialog: () => null,
}))

import { Route as PdcRoute } from "@/routes/_app/pdc"

const Page = PdcRoute.options.component as ComponentType

const plan = (
  id: string,
  status: PdcStatus,
  createdById: string | null = "u-1"
): Pdc =>
  ({
    id,
    createdById,
    homeroomTeacherId: null,
    planNumber: id === "p-1" ? 1 : 2,
    courseName: "1ro A",
    homeroomTeacherName: "Docente",
    trimester: 1,
    areaCount: 3,
    significantAdaptationCount: 0,
    status,
  }) as Pdc

function renderAs(role: "DIRECTOR" | "TEACHER") {
  useAuthStore.setState({ role, userId: "u-1" })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <Page />
    </QueryClientProvider>
  )
}

const rowOf = (label: string) =>
  screen.getByText(label).closest("tr") as HTMLElement

describe("PDC listing — progress", () => {
  afterEach(() => {
    useAuthStore.setState({ role: null, userId: null })
  })

  it("lets the Director read the progress of an approved plan, without the form", async () => {
    rows.current = [plan("p-1", "Approved"), plan("p-2", "Published")]
    renderAs("DIRECTOR")

    // Only an approved plan carries progress.
    expect(
      within(rowOf("Plan Nº 2 · 1ro A")).queryByRole("button", {
        name: "Ver avances",
      })
    ).not.toBeInTheDocument()

    await userEvent.click(
      within(rowOf("Plan Nº 1 · 1ro A")).getByRole("button", {
        name: "Ver avances",
      })
    )

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText("Fracciones equivalentes")
    ).toBeInTheDocument()
    expect(
      within(dialog).queryByLabelText("Contenido avanzado")
    ).not.toBeInTheDocument()
    expect(
      within(dialog).queryByRole("button", { name: "Registrar avance" })
    ).not.toBeInTheDocument()
  })

  it("keeps the teacher's progress form as it was", async () => {
    rows.current = [plan("p-1", "Approved")]
    renderAs("TEACHER")

    const row = rowOf("Plan Nº 1 · 1ro A")
    expect(
      within(row).queryByRole("button", { name: "Ver avances" })
    ).not.toBeInTheDocument()

    await userEvent.click(within(row).getByRole("button", { name: "Avance" }))

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByLabelText("Contenido avanzado")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Registrar avance" })
    ).toBeInTheDocument()
  })
})

describe("PDC listing — copy to parallels", () => {
  afterEach(() => {
    useAuthStore.setState({ role: null, userId: null })
    copy.mutate.mockReset()
  })

  const copyButton = (label: string) =>
    within(rowOf(label)).queryByRole("button", { name: "Copiar a paralelos" })

  it.each<PdcStatus>(["Published", "Under Review", "Approved"])(
    "offers the author the copy of a %s plan and sends its id",
    async (status) => {
      rows.current = [plan("p-1", status)]
      renderAs("TEACHER")

      await userEvent.click(copyButton("Plan Nº 1 · 1ro A") as HTMLElement)

      expect(copy.mutate).toHaveBeenCalledWith("p-1")
    }
  )

  it.each<PdcStatus>(["Draft", "With Observations"])(
    "hides the copy of a %s plan",
    (status) => {
      rows.current = [plan("p-1", status)]
      renderAs("TEACHER")

      expect(copyButton("Plan Nº 1 · 1ro A")).not.toBeInTheDocument()
    }
  )

  it("hides the copy from the Director", () => {
    rows.current = [plan("p-1", "Approved")]
    renderAs("DIRECTOR")

    expect(copyButton("Plan Nº 1 · 1ro A")).not.toBeInTheDocument()
  })

  it("hides the copy of a plan the teacher only takes part in", () => {
    rows.current = [plan("p-1", "Approved", "u-2")]
    renderAs("TEACHER")

    expect(copyButton("Plan Nº 1 · 1ro A")).not.toBeInTheDocument()
  })

  it("offers the copy to the homeroom teacher of the plan's course", async () => {
    rows.current = [
      { ...plan("p-1", "Approved", "u-2"), homeroomTeacherId: "u-1" },
    ]
    renderAs("TEACHER")

    await userEvent.click(copyButton("Plan Nº 1 · 1ro A") as HTMLElement)

    expect(copy.mutate).toHaveBeenCalledWith("p-1")
  })
})
