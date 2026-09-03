/**
 * The form's own look, written out for a file that travels without the app.
 *
 * <p>The preview draws the document with utility classes. Once the markup is saved to disk or
 * handed to a print window there is no Tailwind to resolve them, so everything the paper needs is
 * restated here against the `pdc-*` class names the preview also carries. Those names are the
 * contract between the screen and the file: a styled element the preview does not tag is an
 * element that prints plain.
 *
 * <p>The measurements are the template's own, read out of `Plantilla PDC_Primaria.docx`: Arial
 * Narrow throughout, 11pt for the body and the tables, 10pt for the two section rules, 9pt for the
 * reference table and the holistic objective. The two greens are the fills Word stores — E2EFD9
 * over the development tables, A8D08D over the significant adaptations.
 */
export const PDC_DOCUMENT_CSS = `
@page { size: letter landscape; margin: 0.5in; }
body {
  font-family: "Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.25;
  color: #000;
  background: #fff;
  margin: 0;
}
h3 { font-size: 11pt; font-weight: bold; margin: 0 0 4px; }
p { margin: 0 0 4px; }
table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
td, th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
th { text-align: left; }
.pdc-title { text-align: center; font-weight: bold; }
.pdc-rule { font-size: 10pt; font-weight: bold; }
.pdc-small { font-size: 9pt; }
.pdc-label { font-weight: bold; white-space: nowrap; width: 1%; }
.pdc-head { background: #E2EFD9; font-weight: bold; }
.pdc-band { background: #E2EFD9; text-align: center; font-weight: normal; }
.pdc-head-adapt { background: #A8D08D; font-weight: bold; text-align: center; }
.pdc-band-adapt { background: #A8D08D; font-weight: bold; text-align: center; }
.pdc-date { margin-left: 0.6em; margin-right: 3em; }
.pdc-strong { font-weight: bold; }
/*
 * What the teacher typed, kept as they typed it. The preview asks Tailwind for this; in a file on
 * its own the line breaks of a weekly cell would otherwise collapse into one paragraph.
 *
 * Every cell of the form carries pdc-cell, so the rule is stated once there rather than on each of
 * the dozen places a teacher may press enter. pdc-wrap is for the prose outside the tables: the
 * holistic objective, the month's product, the bibliography.
 */
.pdc-cell, .pdc-wrap { white-space: pre-wrap; }
/*
 * The two signature lines sit side by side on the printed form. A table rather than a grid,
 * because a grid is one of the few layouts Word does not read.
 */
.pdc-signatures { width: 100%; margin-top: 32px; }
.pdc-signatures td { border: none; text-align: center; width: 50%; padding: 0 24px; }
.pdc-sign { border-top: 1px solid #000; padding-top: 4px; }
`

/**
 * Backgrounds are the first thing a browser drops when it prints, and the two greens are what make
 * the sheet recognisable as the form rather than as a grid of text. Asked for on every element,
 * because the rule does not inherit through table cells in every engine.
 */
export const PRINT_COLOR_CSS = `
html, body, table, thead, tbody, tr, td, th, p, div, span, article, header, footer {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
`

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
