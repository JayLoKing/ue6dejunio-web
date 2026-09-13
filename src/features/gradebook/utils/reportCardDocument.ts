import { escapeHtml, PRINT_COLOR_CSS } from "@/lib/printDocument"

/**
 * El aspecto de la libreta, escrito para una hoja que viaja sin la aplicación.
 *
 * El preview dibuja el documento con clases de utilidad. Una vez que el marcado se entrega a una
 * ventana de impresión ya no hay Tailwind que las resuelva, así que todo lo que el papel necesita
 * se vuelve a declarar acá contra los nombres `rc-*` que el preview también lleva. Esos nombres son
 * el contrato entre la pantalla y el papel: un elemento con estilo que el preview no etiquete es un
 * elemento que sale sin formato.
 *
 * Vertical y no apaisada como el PDC: la libreta es una columna de áreas, no una grilla semanal.
 */
export const REPORT_CARD_CSS = `
@page { size: letter portrait; margin: 0.6in; }
body {
  font-family: "Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.3;
  color: #000;
  background: #fff;
  margin: 0;
}
p { margin: 0 0 2px; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #000; padding: 3px 6px; vertical-align: middle; }
.rc-title { text-align: center; font-weight: bold; font-size: 13pt; margin: 0 0 2px; text-transform: uppercase; }
.rc-level { text-align: center; font-weight: 600; font-size: 11pt; margin: 0 0 14px; }
.rc-heading { width: 100%; margin-bottom: 12px; }
.rc-heading td { border: none; padding: 0 12px 2px 0; width: 50%; }
.rc-student { width: 100%; margin-bottom: 12px; border: 1px solid #000; }
.rc-student td { border: none; padding: 3px 8px; }
.rc-label { font-weight: bold; }
.rc-head { background: #DEEAF6; font-weight: bold; text-align: center; }
.rc-field { background: #F2F2F2; font-weight: bold; }
.rc-center { text-align: center; }
.rc-strong { font-weight: bold; }
.rc-literal { margin-top: 10px; }
/*
 * Las dos firmas van lado a lado. Una tabla y no una grilla, porque el documento tiene que
 * imprimirse igual en un motor que no resuelve grid.
 */
.rc-signatures { width: 100%; margin-top: 56px; }
.rc-signatures td { border: none; text-align: center; width: 50%; padding: 0 24px; }
.rc-sign { border-top: 1px solid #000; padding-top: 4px; }
`

/** La libreta como página propia, para imprimir y para guardar en PDF. */
export function printableReportCardOf(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${REPORT_CARD_CSS}
${PRINT_COLOR_CSS}
/* En pantalla la hoja se reduce para entrar en un panel más angosto. El papel tiene su medida. */
body { zoom: 1; padding: 0; }
/* Un campo de saberes partido en dos hojas pierde la fila que nombra sus columnas. */
table { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`
}
