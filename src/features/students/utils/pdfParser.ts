import type { Gender, ParsedStudentRow } from "../types"

/** Un fragmento de texto del PDF con su posición. Lo arma el servicio que lee el archivo. */
export interface TextItem {
  str: string
  x: number
  y: number
  width: number
}

const SPANISH_MONTHS: Record<string, string> = {
  ene: "01",
  enero: "01",
  feb: "02",
  febrero: "02",
  mar: "03",
  marzo: "03",
  abr: "04",
  abril: "04",
  may: "05",
  mayo: "05",
  jun: "06",
  junio: "06",
  jul: "07",
  julio: "07",
  ago: "08",
  agosto: "08",
  sep: "09",
  sept: "09",
  set: "09",
  setiembre: "09",
  septiembre: "09",
  oct: "10",
  octubre: "10",
  nov: "11",
  noviembre: "11",
  dic: "12",
  diciembre: "12",
}

const cleanMonth = (s: string): string =>
  s.replace(/\./g, "").toLowerCase().trim()

export const parseSpanishDate = (raw: string): string | null => {
  const match = raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .match(/^(\d{1,2})\s+de\s+([a-záéíóúñ.]+)\s+de\s+(\d{4})$/i)
  if (!match) return null
  const day = match[1].padStart(2, "0")
  const month = SPANISH_MONTHS[cleanMonth(match[2])]
  const year = match[3]
  if (!month) return null
  return `${year}-${month}-${day}`
}

export const splitFullName = (
  raw: string
): { lastNames: string; names: string; fullName: string } => {
  const tokens = raw.replace(/\s+/g, " ").trim().split(" ").filter(Boolean)
  const fullName = tokens.join(" ")
  if (tokens.length === 0) return { lastNames: "", names: "", fullName: "" }
  if (tokens.length === 1) return { lastNames: tokens[0], names: "", fullName }
  if (tokens.length === 2)
    return { lastNames: tokens[0], names: tokens[1], fullName }
  return {
    lastNames: tokens.slice(0, 2).join(" "),
    names: tokens.slice(2).join(" "),
    fullName,
  }
}

const ROW_NUMBER_X_MAX = 60
const Y_BAND = 14 // px tolerance for grouping multi-line cells into same row

const isRowAnchor = (it: TextItem): boolean =>
  /^\d{1,3}$/.test(it.str.trim()) && it.x < ROW_NUMBER_X_MAX

const DATE_RE = /(\d{1,2})\s+de\s+([a-záéíóúñ.]+)\s+de\s+(\d{4})/i

interface PageRowResult {
  rude: string
  carnet: string
  fullNameRaw: string
  gender: Gender
  birthDate: string
}

const RUDE_TOKEN_RE = /^\d{10,16}[A-Z]?$/i
const CARNET_TOKEN_RE = /^\d{4,9}[A-Z]?$/i
const GENDER_TOKEN_RE = /^[MF]$/

const parseRowBag = (bag: TextItem[]): PageRowResult | null => {
  if (bag.length === 0) return null

  // Sort by reading order: y desc, x asc
  const sorted = [...bag].sort((a, b) => b.y - a.y || a.x - b.x)

  // 1. Find rude (first long token), then carnet (next short numeric token)
  let rudeItem: TextItem | null = null
  let carnetItem: TextItem | null = null
  for (const it of sorted) {
    const s = it.str.trim()
    if (!rudeItem && RUDE_TOKEN_RE.test(s)) {
      rudeItem = it
      continue
    }
    if (
      rudeItem &&
      !carnetItem &&
      CARNET_TOKEN_RE.test(s) &&
      it.x > rudeItem.x + 10
    ) {
      carnetItem = it
      break
    }
  }
  if (!rudeItem || !carnetItem) return null

  // 2. Gender: standalone M/F to the right of carnet, closest in x
  const genderCandidates = sorted.filter(
    (it) => GENDER_TOKEN_RE.test(it.str.trim()) && it.x > carnetItem!.x + 20
  )
  if (genderCandidates.length === 0) return null
  const genderItem = genderCandidates.sort((a, b) => a.x - b.x)[0]
  const gender = genderItem.str.trim() as Gender

  // 3. Date: items right of gender containing date pattern
  const dateBag = sorted.filter((it) => it.x > genderItem.x + 5)
  const dateText = dateBag
    .map((it) => it.str.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
  const dateMatch = dateText.match(DATE_RE)
  if (!dateMatch) return null
  const birthDate = parseSpanishDate(
    `${dateMatch[1]} de ${dateMatch[2]} de ${dateMatch[3]}`
  )
  if (!birthDate) return null

  // 4. Full name: items between carnet and gender by X (any Y in row band)
  const nameLeftX = carnetItem.x + carnetItem.width + 2
  const nameRightX = genderItem.x - 2
  const nameItems = sorted.filter(
    (it) => it.x >= nameLeftX && it.x < nameRightX
  )
  // Re-sort name items by reading order (top→bottom, left→right)
  nameItems.sort((a, b) => b.y - a.y || a.x - b.x)
  const fullNameRaw = nameItems
    .map((it) => it.str.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
  if (!fullNameRaw) return null

  return {
    rude: rudeItem.str.trim(),
    carnet: carnetItem.str.trim(),
    fullNameRaw,
    gender,
    birthDate,
  }
}

/**
 * Los estudiantes que hay en el texto de una página, ya numerados.
 *
 * Recibe el texto y no el PDF: leer el archivo es entrada/salida y vive en el servicio, mientras
 * que reconocer una fila entre coordenadas es una derivación, y se puede probar sin abrir nada.
 *
 * @param startIndex cuántas filas trajeron las páginas anteriores, para que rowIndex sea corrido
 */
export const studentRowsFromItems = (
  items: TextItem[],
  startIndex: number
): ParsedStudentRow[] => {
  // Los números de fila alineados a la izquierda anclan cada renglón.
  const anchors = items.filter(isRowAnchor).sort((a, b) => b.y - a.y)
  if (anchors.length === 0) return []

  // Descarta anclas repetidas a una y casi idéntica (raro, pero pasa).
  const uniqueAnchors: TextItem[] = []
  for (const a of anchors) {
    if (
      !uniqueAnchors.length ||
      Math.abs(uniqueAnchors[uniqueAnchors.length - 1].y - a.y) > 4
    ) {
      uniqueAnchors.push(a)
    }
  }

  const collected: ParsedStudentRow[] = []
  let index = startIndex

  for (let i = 0; i < uniqueAnchors.length; i++) {
    const anchor = uniqueAnchors[i]
    const prevAnchor = uniqueAnchors[i - 1]
    const nextAnchor = uniqueAnchors[i + 1]

    // El punto medio con cada vecina marca el borde de la banda.
    // Y del PDF: valor más alto = más arriba. Las anclas vienen en orden descendente.
    const upperY = prevAnchor
      ? (prevAnchor.y + anchor.y) / 2
      : anchor.y + Y_BAND
    const lowerY = nextAnchor
      ? (anchor.y + nextAnchor.y) / 2
      : anchor.y - Y_BAND

    const bag = items.filter((it) => it.y <= upperY && it.y > lowerY)

    const parsed = parseRowBag(bag)
    if (!parsed) continue

    const { lastNames, names, fullName } = splitFullName(parsed.fullNameRaw)
    if (!lastNames) continue

    collected.push({
      rowIndex: ++index,
      rudeCode: parsed.rude,
      identityCard: parsed.carnet,
      names: names || lastNames,
      lastNames,
      rawFullName: parsed.fullNameRaw,
      fullName,
      birthDate: parsed.birthDate,
      gender: parsed.gender,
    })
  }

  return collected
}
