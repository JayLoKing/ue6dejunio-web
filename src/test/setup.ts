import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom ships no ResizeObserver, and Radix primitives (ScrollArea, Select) subscribe to one in a
// layout effect. Without this stub any component built on them throws on mount instead of
// rendering. Measurement is meaningless in jsdom anyway, so a no-op observer is the honest stub.
class NoopResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= NoopResizeObserver

afterEach(() => {
  cleanup()
})
