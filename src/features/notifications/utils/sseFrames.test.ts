import { describe, expect, it } from "vitest"

import { readSseFrames } from "./sseFrames"

describe("readSseFrames", () => {
  it("reads a whole frame", () => {
    const { events, rest } = readSseFrames("event: notification\ndata: abc\n\n")

    expect(events).toEqual([{ event: "notification", data: "abc" }])
    expect(rest).toBe("")
  })

  // A chunk is whatever the network handed over, not a frame. Parsing half of one and throwing
  // the remainder away is how a nudge goes missing on a slow connection.
  it("keeps a half-arrived frame for the next chunk", () => {
    const { events, rest } = readSseFrames("event: notification\ndata: ab")

    expect(events).toEqual([])
    expect(rest).toBe("event: notification\ndata: ab")
  })

  it("reads several frames out of one chunk", () => {
    const { events } = readSseFrames(
      "event: heartbeat\ndata: 1\n\nevent: notification\ndata: abc\n\n"
    )

    expect(events).toEqual([
      { event: "heartbeat", data: "1" },
      { event: "notification", data: "abc" },
    ])
  })

  // The spec allows \r\n, and a proxy may rewrite the line endings on the way through.
  it("reads a frame that arrived with carriage returns", () => {
    const { events } = readSseFrames("event: heartbeat\r\ndata: 1\r\n\r\n")

    expect(events).toEqual([{ event: "heartbeat", data: "1" }])
  })

  // "message" is what the spec calls an unnamed event, and treating it as unnamed here would
  // silently drop anything the server sends without a name.
  it("calls an unnamed event a message", () => {
    const { events } = readSseFrames("data: hello\n\n")

    expect(events).toEqual([{ event: "message", data: "hello" }])
  })

  // Servers open a stream with a comment to flush the headers. It is not an event.
  it("ignores comment lines", () => {
    const { events } = readSseFrames(": ping\n\n")

    expect(events).toEqual([])
  })

  it("joins the data lines of one frame with a newline, as the spec says", () => {
    const { events } = readSseFrames(
      "event: notification\ndata: a\ndata: b\n\n"
    )

    expect(events).toEqual([{ event: "notification", data: "a\nb" }])
  })
})
