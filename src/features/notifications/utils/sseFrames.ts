/** One event off the wire. `data` is raw text; what it means belongs to whoever asked for it. */
export interface SseEvent {
  event: string
  data: string
}

export interface SseRead {
  events: SseEvent[]
  /** The tail of the buffer that is not a whole frame yet, to prepend to the next chunk. */
  rest: string
}

/** What the spec calls an event that arrived without a name. */
const UNNAMED = "message"

const FRAME_END = /\r\n\r\n|\n\n|\r\r/

/**
 * Turns the text read so far into whole events, and hands back what is still incomplete.
 *
 * <p>Pure, and separate from the connection on purpose. A chunk is whatever the network handed
 * over — it can end halfway through a frame, and carry three of them at once. That is the part
 * worth testing, and it is testable only while it has nothing to do with `fetch`.
 */
export function readSseFrames(buffer: string): SseRead {
  const events: SseEvent[] = []
  let rest = buffer

  for (;;) {
    const end = rest.search(FRAME_END)
    if (end === -1) break

    const frame = rest.slice(0, end)
    // The separator is two line breaks of whichever flavour arrived; the match tells us how long.
    const separator = FRAME_END.exec(rest.slice(end))?.[0] ?? "\n\n"
    rest = rest.slice(end + separator.length)

    const parsed = frameToEvent(frame)
    if (parsed) events.push(parsed)
  }

  return { events, rest }
}

/**
 * One frame's lines into one event, or nothing.
 *
 * <p>Nothing for a frame that carries no data: a lone comment is how a server flushes its response
 * headers, and reading it as an empty event would have the caller refetch for no reason.
 */
function frameToEvent(frame: string): SseEvent | null {
  let name = ""
  const data: string[] = []

  for (const raw of frame.split(/\r\n|\n|\r/)) {
    // A comment. The colon-first line is the spec's own keep-alive.
    if (raw.startsWith(":")) continue

    const colon = raw.indexOf(":")
    const field = colon === -1 ? raw : raw.slice(0, colon)
    // One optional space after the colon belongs to the framing, not to the value.
    const value = colon === -1 ? "" : raw.slice(colon + 1).replace(/^ /, "")

    if (field === "event") name = value
    else if (field === "data") data.push(value)
  }

  if (data.length === 0) return null
  return { event: name || UNNAMED, data: data.join("\n") }
}
