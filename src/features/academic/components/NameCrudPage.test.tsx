import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  NameCrudPage,
  type NameCrudPageProps,
  type NameEntity,
} from "./NameCrudPage"

// Only the create form is under test, so every mutation is an idle stub.
const idleMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
}
const mutations = {
  create: idleMutation,
  update: idleMutation,
  remove: idleMutation,
} as unknown as NameCrudPageProps<NameEntity>["mutations"]

const renderPage = () =>
  render(
    <NameCrudPage<NameEntity>
      title="Niveles"
      description="Niveles de la unidad"
      label="Nivel"
      useList={() => ({
        data: undefined,
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      })}
      mutations={mutations}
    />
  )

const EMPTY_NAME_ERROR = "Nivel: mínimo 1 caracteres"

describe("NameCrudPage create form validation timing", () => {
  it("reports an empty name as soon as the field is left", async () => {
    renderPage()
    await userEvent.click(screen.getByRole("button", { name: /nuevo nivel/i }))

    await userEvent.click(screen.getByLabelText("Nivel"))
    expect(screen.queryByText(EMPTY_NAME_ERROR)).not.toBeInTheDocument()

    await userEvent.tab()

    expect(await screen.findByText(EMPTY_NAME_ERROR)).toBeInTheDocument()
  })

  /** Leaving the field is now enough to raise the error, so closing must not carry it over. */
  it("opens the create dialog again without the previous error", async () => {
    renderPage()
    const openCreate = async () =>
      userEvent.click(
        await screen.findByRole("button", { name: /nuevo nivel/i })
      )

    await openCreate()
    await userEvent.click(screen.getByLabelText("Nivel"))
    await userEvent.tab()
    expect(await screen.findByText(EMPTY_NAME_ERROR)).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")
    await openCreate()

    expect(await screen.findByLabelText("Nivel")).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_NAME_ERROR)).not.toBeInTheDocument()
  })
})
