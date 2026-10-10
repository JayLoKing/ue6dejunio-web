import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const useCentralizer = vi.hoisted(() => vi.fn())
vi.mock("../hooks/useGradebook", () => ({ useCentralizer }))

import { AverageRanking } from "./AverageRanking"

/**
 * The course ranked by general average. A failed fetch and a course with no marks yet both leave
 * the list empty, but only one of them means "nothing to rank": the other one has to say so.
 */

describe("AverageRanking", () => {
  it("says the ranking could not be loaded when the request fails", () => {
    useCentralizer.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<AverageRanking courseId="c-1" />)

    expect(
      screen.getByText("No se pudo cargar el ranking de promedios.")
    ).toBeInTheDocument()
    expect(screen.queryByText("Sin datos.")).not.toBeInTheDocument()
  })

  it("says there is no data when the course has nobody to rank", () => {
    useCentralizer.mockReturnValue({
      data: { content: [], page: 0, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
    })

    render(<AverageRanking courseId="c-1" />)

    expect(screen.getByText("Sin datos.")).toBeInTheDocument()
  })
})
