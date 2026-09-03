import { escapeHtml, PDC_DOCUMENT_CSS, PRINT_COLOR_CSS } from "./documentStyles"

/**
 * The document as a page of its own, for printing and for saving as PDF.
 *
 * <p>Printing it where it is drawn does not work. On screen the sheet lives inside a dialog — a
 * fixed, transformed box with its own scrolling — and none of those can be undone from a print
 * stylesheet: an absolutely positioned child is placed against the dialog rather than the page, and
 * an overflow container crops whatever hangs outside it. What came out was a cropped sheet with the
 * form's fills missing.
 *
 * <p>So the document is handed to a page that has none of that around it: no app, no dialog, no
 * stylesheet but this one. What the browser prints is then the document and nothing else.
 */
export function printableDocumentOf(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${PDC_DOCUMENT_CSS}
${PRINT_COLOR_CSS}
/* The screen reduces the sheet to fit a panel it is wider than. Paper has a size of its own. */
body { zoom: 1; padding: 0; }
/* A subject's table split across two sheets loses the header row that names its columns. */
table { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`
}
