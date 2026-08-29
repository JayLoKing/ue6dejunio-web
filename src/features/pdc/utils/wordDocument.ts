/**
 * The document as a file Word opens.
 *
 * <p>Word reads HTML as a document when the file announces the Office namespaces and carries its
 * page setup inside a `@page` rule. That is enough for a form built out of tables, and it keeps the
 * result editable — which a rendered PDF is not — without pulling in a document library for a
 * layout the preview already draws.
 *
 * <p>The file travels without the app's stylesheet, so everything the paper needs is declared here
 * against the document's own `pdc-*` classes: the same names the preview carries, restated because
 * a utility framework's classes mean nothing once the file is opened somewhere else.
 */
export function wordDocumentOf(bodyHtml: string, title: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
@page { size: letter landscape; margin: 0.5in; }
body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 11pt; color: #000; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
th { text-align: left; }
.pdc-title { text-align: center; font-weight: bold; }
.pdc-rule { font-size: 10pt; font-weight: bold; }
.pdc-small { font-size: 9pt; }
.pdc-label { font-weight: bold; white-space: nowrap; }
.pdc-head { background: #E2EFD9; font-weight: bold; }
.pdc-band { background: #E2EFD9; font-weight: bold; text-align: center; border: 1px solid #000; padding: 4px 6px; }
.pdc-head-adapt { background: #A8D08D; font-weight: bold; }
.pdc-band-adapt { background: #A8D08D; font-weight: bold; text-align: center; border: 1px solid #000; padding: 4px 6px; }
.pdc-strong { font-weight: bold; }
.pdc-sign { border-top: 1px solid #000; text-align: center; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
