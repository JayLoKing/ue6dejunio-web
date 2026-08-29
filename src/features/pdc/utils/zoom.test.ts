import { describe, expect, it } from "vitest"

import { ZOOM_STEPS, zoomIn, zoomOut } from "./zoom"

describe("zoom", () => {
  it("moves one step at a time through the offered sizes", () => {
    expect(zoomIn(0.75)).toBe(1)
    expect(zoomOut(0.75)).toBe(0.6)
  })

  // The buttons are disabled at the ends, but a stale click must not walk off the list and leave
  // the sheet at an undefined size.
  it("stops at the ends instead of running past them", () => {
    const smallest = ZOOM_STEPS[0]
    const largest = ZOOM_STEPS[ZOOM_STEPS.length - 1]

    expect(zoomOut(smallest)).toBe(smallest)
    expect(zoomIn(largest)).toBe(largest)
  })

  // A size that is not one of the steps — a stored preference from another version, say — snaps to
  // the nearest offered one rather than being carried forward.
  it("snaps a size that is not a step to the nearest one", () => {
    expect(zoomIn(0.72)).toBe(1)
    expect(zoomOut(0.72)).toBe(0.6)
  })
})
