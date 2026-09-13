/**
 * Printing an official document that is drawn inside the app.
 *
 * <p>Shared by every sheet the school prints, because the awkward parts are the same for all of
 * them and a copy of this is a copy that misses the next fix.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Backgrounds are the first thing a browser drops when it prints, and the fills are what make a
 * sheet recognisable as the form rather than as a grid of text. Asked for on every element,
 * because the rule does not inherit through table cells in every engine.
 */
export const PRINT_COLOR_CSS = `
html, body, table, thead, tbody, tr, td, th, p, div, span, article, header, footer {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
`

/**
 * Prints an element on a page of its own.
 *
 * <p>Not `window.print()`. On screen these sheets sit inside a dialog or a scrolling panel, which
 * is a fixed, transformed, clipping box, and no print stylesheet can lift a child out of one — the
 * sheet comes out cropped and the form's fills go missing on the way. Handed to a frame holding
 * nothing but the document, there is nothing left to escape from.
 *
 * @param elementId the node to lift out; nothing happens when it is not on the page.
 * @param title     the name the print dialog and the saved PDF carry.
 * @param pageOf    builds the whole standalone page from the element's markup.
 */
export function printElementById(
  elementId: string,
  title: string,
  pageOf: (bodyHtml: string, title: string) => string
): void {
  const node = document.getElementById(elementId)
  if (!node) return

  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.setAttribute("title", title)
  frame.style.position = "fixed"
  frame.style.right = "0"
  frame.style.bottom = "0"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"

  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) {
      frame.remove()
      return
    }
    // Taking the frame away while the dialog is still open cancels the job in some browsers, so it
    // leaves on afterprint — and on a timer too, because Safari does not always fire it.
    const done = () => frame.remove()
    view.addEventListener("afterprint", done, { once: true })
    setTimeout(done, 60_000)
    view.focus()
    view.print()
  }

  document.body.appendChild(frame)
  frame.srcdoc = pageOf(node.innerHTML, title)
}
