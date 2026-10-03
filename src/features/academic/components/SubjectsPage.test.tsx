import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubjectsPage } from "./SubjectsPage"
import type { Subject } from "../types"

const matematicas: Subject = {
  id: "s-1",
  name: "Matemáticas",
  areaId: 4,
  areaName: "Ciencia Tecnología y Producción",
  technical: false,
  active: true,
}
const musica: Subject = {
  id: "s-2",
  name: "Música",
  areaId: 2,
  areaName: "Comunidad y Sociedad",
  technical: true,
  active: false,
}

const listCalls: string[] = []
const updateMutate = vi.fn()
let isError = false

vi.mock("../hooks/useAcademic", () => ({
  useSubjectsAdmin: (_q: unknown, status: string) => {
    listCalls.push(status)
    const content =
      status === "inactive"
        ? [musica]
        : status === "all"
          ? [matematicas, musica]
          : [matematicas]
    return {
      data: isError
        ? undefined
        : { content, page: 0, size: 10, total: content.length, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isError,
      refetch: vi.fn(),
    }
  },
  useAllKnowledgeAreas: () => ({ data: { content: [] }, isLoading: false }),
  useCreateSubject: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateSubject: () => ({
    mutate: updateMutate,
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSubject: () => ({ mutate: vi.fn(), isPending: false }),
}))

beforeEach(() => {
  listCalls.length = 0
  updateMutate.mockClear()
  isError = false
})

async function pick(option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: "Estado" }))
  await userEvent.click(await screen.findByRole("option", { name: option }))
}

describe("SubjectsPage status filter", () => {
  it("lists the active subjects by default and offers no reactivation", () => {
    render(<SubjectsPage />)
    expect(listCalls.at(-1)).toBe("active")
    expect(screen.getByText("Matemáticas")).toBeInTheDocument()
    expect(screen.queryByText("Música")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Reactivar/ })
    ).not.toBeInTheDocument()
  })

  it("shows the inactive subjects with their badge when asked", async () => {
    render(<SubjectsPage />)
    await pick("Inactivas")
    expect(listCalls.at(-1)).toBe("inactive")
    const card = screen.getByText("Música").closest("div.group") as HTMLElement
    expect(within(card).getByText("Inactiva")).toBeInTheDocument()
  })

  it("lists both kinds under Todas", async () => {
    render(<SubjectsPage />)
    await pick("Todas")
    expect(listCalls.at(-1)).toBe("all")
    expect(screen.getByText("Matemáticas")).toBeInTheDocument()
    expect(screen.getByText("Música")).toBeInTheDocument()
  })

  it("reactivates an inactive subject by sending active=true with its data", async () => {
    render(<SubjectsPage />)
    await pick("Inactivas")
    await userEvent.click(
      screen.getByRole("button", { name: "Reactivar Música" })
    )
    expect(updateMutate).toHaveBeenCalledWith({
      id: "s-2",
      name: "Música",
      id_area: 2,
      technical: true,
      active: true,
    })
  })

  it("says the list failed to load instead of claiming there are no subjects", () => {
    isError = true
    render(<SubjectsPage />)
    expect(screen.getByText(/No se pudieron cargar/)).toBeInTheDocument()
    expect(screen.queryByText("Sin materias.")).not.toBeInTheDocument()
  })
})
