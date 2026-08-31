import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount((n) => n + 1)}>
      count is {count}
    </button>
  )
}

describe("vitest + rtl smoke", () => {
  it("renders and reacts to clicks", async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const button = screen.getByRole("button", { name: /count is 0/i })
    expect(button).toBeInTheDocument()

    await user.click(button)

    expect(
      screen.getByRole("button", { name: /count is 1/i })
    ).toBeInTheDocument()
  })
})
