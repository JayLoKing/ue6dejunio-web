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

// The same gap, one layer down. jsdom implements no pointer capture and no scrolling, and Radix
// Select calls both while opening: without these a test that clicks the trigger dies on
// "hasPointerCapture is not a function" instead of showing the options. Neither does anything
// observable in jsdom, so a no-op is the honest stub rather than a simulation.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

afterEach(() => {
  cleanup()
})
