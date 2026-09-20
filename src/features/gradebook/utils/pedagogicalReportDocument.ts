import { escapeHtml, PRINT_COLOR_CSS } from "@/lib/printDocument"

/**
 * El aspecto del informe pedagógico, escrito para una hoja que viaja sin la aplicación.
 *
 * El preview dibuja el documento con clases de utilidad. Una vez que el marcado se entrega a una
 * ventana de impresión ya no hay Tailwind que las resuelva, así que todo lo que el papel necesita
 * se vuelve a declarar acá contra los nombres `ip-*` que el preview también lleva. Esos nombres son
 * el contrato entre la pantalla y el papel: un elemento con estilo que el preview no etiquete es un
 * elemento que sale sin formato.
 *
 * Vertical y con margen de una pulgada, la puesta en página del documento que entrega la escuela.
 */
export const PEDAGOGICAL_REPORT_CSS = `
@page { size: letter portrait; margin: 1in; }
body {
  font-family: "Arial", "Liberation Sans", sans-serif;
  font-size: 11pt;
  line-height: 1.25;
  color: #000;
  background: #fff;
  margin: 0;
}
p { margin: 0; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
td, th { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
.ip-title { text-align: center; font-weight: bold; font-size: 13pt; margin: 0 0 14px; text-transform: uppercase; }
.ip-rule { font-weight: bold; margin: 14px 0 4px; }
.ip-head { background: #D9D9D9; font-weight: bold; text-align: center; }
.ip-label { font-weight: bold; white-space: nowrap; width: 1%; }
.ip-center { text-align: center; }
/* La prosa del docente conserva sus saltos de línea: los escribió él, no son formato nuestro. */
.ip-wrap { white-space: pre-wrap; text-align: justify; }
/* Las dos cajas de la sección II se imprimen con su altura aunque el docente haya escrito poco. */
.ip-prose { height: 1.6in; }
/*
 * Los anchos del cuadro IV van declarados acá porque en el papel no hay Tailwind que resuelva las
 * utilidades del preview: sin esto las seis columnas salen iguales y la de acciones — que es la
 * que lleva un párrafo — queda tan angosta como la del número.
 */
.ip-failing col:nth-child(1) { width: 6%; }
.ip-failing col:nth-child(2) { width: 20%; }
.ip-failing col:nth-child(3) { width: 17%; }
.ip-failing col:nth-child(4) { width: 9%; }
.ip-failing col:nth-child(5) { width: 32%; }
.ip-failing col:nth-child(6) { width: 16%; }
.ip-closing { margin-top: 20px; text-align: justify; }
/*
 * La firma va en una tabla sin bordes, no en una grilla: el documento tiene que imprimirse igual
 * en un motor que no resuelve grid.
 */
.ip-signature { margin-top: 64px; }
.ip-signature td { border: none; text-align: center; width: 50%; padding: 0 24px; }
.ip-sign { border-top: 1px solid #000; padding-top: 4px; }
`

/** El informe como página propia, para imprimir y para guardar en PDF. */
export function printablePedagogicalReportOf(
  bodyHtml: string,
  title: string
): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${PEDAGOGICAL_REPORT_CSS}
${PRINT_COLOR_CSS}
/* En pantalla la hoja se reduce para entrar en un panel más angosto. El papel tiene su medida. */
body { zoom: 1; padding: 0; }
/* El cuadro de reprobados partido en dos hojas pierde la fila que nombra sus columnas. */
table { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`
}
