// Local persistence layer for sheets. Swap these 4 functions for API calls
// when the backend is ready — the rest of the app doesn't care where data lives.
import { useEffect, useState } from 'react'
import { blankSheet, exampleSheet, todayStr } from './sheetData'

const STORE_KEY = 'fuel-hose-sheets'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list))
  // Notify other hook instances in this tab.
  window.dispatchEvent(new Event('sheets-changed'))
}

export function sheetTitle(data) {
  return data.partName?.trim() || data.partNo?.trim() || 'เอกสารไม่มีชื่อ'
}

// Hook giving a live list of all sheets.
export function useSheets() {
  const [sheets, setSheets] = useState(readAll)
  useEffect(() => {
    const sync = () => setSheets(readAll())
    window.addEventListener('sheets-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('sheets-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return sheets
}

export function getSheet(id) {
  return readAll().find((s) => s.id === id) || null
}

// A sheet's identity = PART No. + REVISION No. (normalized). Empty part no = no key.
export function dupeKey(partNo, revisionNo) {
  const pn = String(partNo || '').trim().toLowerCase().replace(/\s+/g, '')
  const rv = String(revisionNo || '').trim().toLowerCase()
  return pn ? `${pn}|${rv}` : ''
}

// Find an existing sheet with the same identity (optionally excluding one id).
export function findDuplicate(partNo, revisionNo, exceptId) {
  const key = dupeKey(partNo, revisionNo)
  if (!key) return null
  return readAll().find((s) => s.id !== exceptId && dupeKey(s.data.partNo, s.data.revisionNo) === key) || null
}

export function createSheet(fromExample = false) {
  const now = Date.now()
  const data = fromExample ? exampleSheet() : blankSheet()
  data.issuedDate = todayStr() // always stamp a new sheet with the current date
  const record = {
    id: crypto.randomUUID(),
    data,
    createdAt: now,
    updatedAt: now,
  }
  writeAll([record, ...readAll()])
  return record
}

// Create a new sheet from imported data (merged onto a blank so every field exists).
export function createSheetFromData(data) {
  const now = Date.now()
  const record = {
    id: crypto.randomUUID(),
    data: { ...blankSheet(), ...data, issuedDate: todayStr() },
    createdAt: now,
    updatedAt: now,
  }
  writeAll([record, ...readAll()])
  return record
}

export function saveSheet(id, data) {
  const list = readAll()
  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) return
  list[idx] = { ...list[idx], data, updatedAt: Date.now() }
  writeAll(list)
}

export function deleteSheet(id) {
  writeAll(readAll().filter((s) => s.id !== id))
}

export function duplicateSheet(id) {
  const src = getSheet(id)
  if (!src) return null
  const now = Date.now()
  const record = { id: crypto.randomUUID(), data: { ...src.data }, createdAt: now, updatedAt: now }
  writeAll([record, ...readAll()])
  return record
}

// Re-export so callers have one import.
export { blankSheet, exampleSheet, todayStr }
