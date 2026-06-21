// Excel (.xlsx) import/export for the Technical Sheet, using SheetJS.
//
// Two import shapes are supported:
//   1) Simple 2-column key/value sheet (our own template: A = field key, B = value)
//   2) The "TC Format Rev.2" visual layout (the real factory workbook), mapped by
//      fixed cell addresses.
import * as XLSX from 'xlsx'
import { blankSheet, exampleSheet } from './sheetData'

/* ----------------------------- helpers ----------------------------- */

function scalarKeys() {
  const base = blankSheet()
  return Object.keys(base).filter((k) => typeof base[k] === 'string')
}

function scalarEntries(obj) {
  return Object.entries(obj).filter(([, v]) => typeof v === 'string')
}

// Excel date serial / JS Date -> M/D/YYYY (the format the form uses).
function fmtDate(v) {
  if (v instanceof Date) return `${v.getMonth() + 1}/${v.getDate()}/${v.getFullYear()}`
  if (typeof v === 'number' && v > 20000) {
    const d = new Date(Math.round((v - 25569) * 86400000))
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`
  }
  return v == null ? '' : String(v).trim()
}

// Read a single cell as a clean string.
function cv(ws, addr) {
  const c = ws[addr]
  if (c == null || c.v == null) return ''
  return c.v instanceof Date ? fmtDate(c.v) : String(c.v).trim()
}

// Read a date cell. Excel stores dates as numeric serials; convert via UTC so the
// calendar day never shifts with the local timezone.
function cd(ws, addr) {
  const c = ws[addr]
  if (c == null || c.v == null) return ''
  if (typeof c.v === 'number') return fmtDate(c.v)
  return c.v instanceof Date ? fmtDate(c.v) : String(c.v).trim()
}

// Join several cells (values that the template splits across columns).
function join(ws, addrs) {
  return addrs.map((a) => cv(ws, a)).filter(Boolean).join(' ').trim()
}

// Fix the source file's character corruption + stray units.
const fixMojibake = (s) => s.replace(/ฑ/g, '±')
const stripUnit = (s) => s.replace(/\s*(MPa\.?|mm\.?|o?°?C|kPa\.?)\s*$/i, '').trim()

/* --------------------------- template export --------------------------- */

export function downloadTemplate() {
  const rows = [['Field', 'Value'], ...scalarEntries(exampleSheet())]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 22 }, { wch: 40 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Technical Sheet')
  XLSX.writeFile(wb, 'technical-sheet-template.xlsx')
}

/* ----------------------------- format detection ----------------------------- */

function isVisualFormat(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]]
  return !!ws && String(ws['A1']?.v || '').toUpperCase().includes('TECHNICAL SHEET')
}

// Data sheets only (skip the blank master template like "TC Format Rev.2").
function listDataSheets(wb) {
  return wb.SheetNames.filter((n) => !/format/i.test(n))
}

/* ----------------------------- 2-column parser ----------------------------- */

function parseKeyValue(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return {}
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
  const valid = new Set(scalarKeys())
  const out = {}
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue
    const key = String(row[0]).trim()
    if (valid.has(key)) out[key] = row[1] == null ? '' : String(row[1])
  }
  return out
}

/* -------------------- TC Format Rev.2 visual parser -------------------- */

function parseVisualSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return {}

  const data = {
    // header
    model: cv(ws, 'F5'),
    code: cv(ws, 'M5'),
    documentNo: cv(ws, 'W5'),
    partNo: cv(ws, 'F6'),
    partName: cv(ws, 'F7'),
    revisionNo: cv(ws, 'W7'),

    // component (left = G, right = U). The Rev.2 file's CONNECTOR maps to the FM
    // "JOINT TUBE" field; its 2nd CAP (U14/U15) has no slot in the FM form, so skip it.
    tube: cv(ws, 'G8'), tubePartNo: cv(ws, 'G9'),
    protector3: cv(ws, 'U8'), protector3PartNo: cv(ws, 'U9'),
    jointTube: cv(ws, 'G10'), jointTubePartNo: cv(ws, 'G11'),
    jointFuel: cv(ws, 'U10'), jointFuelPartNo: cv(ws, 'U11'),
    protector1: cv(ws, 'G12'), protector1PartNo: cv(ws, 'G13'),
    protector2: cv(ws, 'U12'), protector2PartNo: cv(ws, 'U13'),
    cap: cv(ws, 'G14'), capPartNo: cv(ws, 'G15'),
    oring: cv(ws, 'G18'), oringPartNo: cv(ws, 'G19'),
    tap: cv(ws, 'G16'), tapPartNo: cv(ws, 'G17'),
    sticker: cv(ws, 'U16'), stickerPartNo: cv(ws, 'U17'),

    // (1) hose cutting
    printOfTube: cv(ws, 'H20'),
    tubeId: join(ws, ['J21', 'K21', 'L21', 'M21']).replace(/^f\b/, 'Ø'),
    lengthOfTube: fixMojibake(join(ws, ['H22', 'K22', 'L22'])),

    // (2) flare & insertion
    dimA: fixMojibake(join(ws, ['L23', 'M23', 'N23'])),
    dimB: fixMojibake(join(ws, ['L24', 'M24', 'N24'])),
    dimC: cv(ws, 'L25'),
    flareTempSet: fixMojibake(join(ws, ['L26', 'M26', 'N26'])),
    flareTempActual: fixMojibake(join(ws, ['L27', 'M27', 'N27'])),
    flareAirPressure: stripUnit(cv(ws, 'H28')),
    flaringJigJoint: cv(ws, 'L30'),
    flaringJigConnector: cv(ws, 'L31'),
    jigSupportJointFuel: cv(ws, 'L34'),
    jigSupportJointTube: cv(ws, 'L35'),
    jigClampProtector1: cv(ws, 'L36'),
    jigClampProtector2: cv(ws, 'L37'),
    jigClampProtectorMiddle: cv(ws, 'L38'),
    jigLubricantFeeder: cv(ws, 'L39'),

    // (3) heating & bending
    heatAirPressure: stripUnit(cv(ws, 'Y32')),
    heatMachineNo: cv(ws, 'V33'),
    protectorSwitch: cv(ws, 'V34'),
    setingTemp: fixMojibake(join(ws, ['X35', 'Y35', 'Z35'])),
    surfaceJigTemp: fixMojibake(join(ws, ['X36', 'Y36', 'Z36'])),
    heatingJigNo: cv(ws, 'V37'),
    bendingJigNo: cv(ws, 'V38'),

    // (4) leak test
    leakLimitPress: join(ws, ['I40', 'M40']),
    leakTestJig: cv(ws, 'I41'),
    testChannel: cv(ws, 'L42'),
    testChannelPressure: stripUnit(cv(ws, 'N42')),

    // (5) inspection
    inspectionGauge: cv(ws, 'Y39'),
    tolOfShape: cv(ws, 'Y40'),
    colorMark: cv(ws, 'Y41'),
    quantityMark: cv(ws, 'Y42'),
  }

  // revise record (rows 45-47)
  const revise = []
  for (const r of [45, 46, 47]) {
    const row = {
      no: cv(ws, 'A' + r), date: cd(ws, 'C' + r), detail: cv(ws, 'F' + r),
      pe: cv(ws, 'M' + r), prod: cv(ws, 'P' + r), qa: cv(ws, 'S' + r),
    }
    if (Object.values(row).some(Boolean)) revise.push(row)
  }
  if (revise.length) data.reviseRecord = revise

  return data
}

/* ----------------------------- public entry ----------------------------- */

// Import an .xlsx file. `pickSheet(sheetNames)` is called (may be async) when the
// visual workbook has more than one data sheet; return the chosen name or null to cancel.
// Returns { data, format, source } or null if cancelled.
export async function importExcel(file, pickSheet) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  if (isVisualFormat(wb)) {
    const sheets = listDataSheets(wb)
    if (sheets.length === 0) return { data: {}, format: 'visual' }
    let name = sheets[0]
    if (sheets.length > 1 && pickSheet) {
      name = await pickSheet(sheets)
      if (!name) return null
    }
    return { data: parseVisualSheet(wb, name), format: 'visual', source: name }
  }

  return { data: parseKeyValue(wb), format: 'kv' }
}

// Import every data sheet at once (for the Dashboard): returns an array of
// { data, source } — one entry per sheet (or a single entry for a 2-column file).
export async function importAllSheets(file) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  if (isVisualFormat(wb)) {
    return listDataSheets(wb).map((name) => ({ data: parseVisualSheet(wb, name), source: name }))
  }
  return [{ data: parseKeyValue(wb) }]
}
