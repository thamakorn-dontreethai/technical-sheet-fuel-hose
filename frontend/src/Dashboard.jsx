import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSheets, createSheet, createSheetFromData, deleteSheet, findDuplicate,
} from './sheetStore'
import { importAllSheets } from './excel'

function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const sheets = useSheets()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...sheets].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!q) return sorted
    return sorted.filter((s) =>
      [s.data.partName, s.data.partNo, s.data.model, s.data.documentNo]
        .filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [sheets, query])

  // Group documents by MODEL — one card per model, parts selectable inside it.
  const groups = useMemo(() => {
    const map = new Map()
    for (const s of filtered) {
      const m = (s.data.model || '').trim() || '— No model —'
      if (!map.has(m)) map.set(m, [])
      map.get(m).push(s)
    }
    return [...map.entries()].map(([model, list]) => ({ model, list }))
  }, [filtered])

  const handleNew = (fromExample = false) => {
    const rec = createSheet(fromExample)
    navigate(`/sheet/${rec.id}`)
  }

  const handleDeleteGroup = (list) => {
    if (confirm(`Permanently delete all documents in this group (${list.length} items)?`)) {
      list.forEach((s) => deleteSheet(s.id))
    }
  }

  // Import an .xlsx → create one document per sheet (master files have many parts).
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const results = await importAllSheets(file)
      const valid = results.filter((r) =>
        Object.values(r.data).some((v) => typeof v === 'string' && v.trim() !== ''),
      )
      if (valid.length === 0) {
        alert(
          'No matching data found in this file\n\n' +
            'Supported: a real Technical Sheet file (TC Format Rev.2) or a 2-column (field/value) file',
        )
        return
      }

      // Duplicates (same PART No. + Rev., including ones created earlier in this
      // same batch) are rejected outright — only fresh sheets are created.
      const fresh = []
      let skipped = 0
      for (const r of valid) {
        if (findDuplicate(r.data.partNo, r.data.revisionNo, null)) skipped++
        else { createSheetFromData(r.data); fresh.push(r) }
      }

      let msg = `created ${fresh.length} document(s)`
      if (skipped > 0) msg += `, skipped ${skipped} duplicate(s) (already exist)`
      alert('Import complete: ' + msg)
    } catch (err) {
      alert('Excel import failed: ' + err.message)
    }
  }

  return (
    <div className="dash">
      {/* Top app bar */}
      <header className="dash-bar">
        <div className="dash-brand">
          <div className="logo-mark">FH</div>
          <div>
            <div className="dash-brand-title">Fuel Hose Technical Sheet</div>
            <div className="dash-brand-sub">Technical document management</div>
          </div>
        </div>
        <div className="dash-bar-actions">
          
          <label className="btn lg">
            📥 Import Excel
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImport}
              hidden
            />
          </label>
          <button className="btn primary lg" onClick={() => handleNew(false)}>
            <span className="ic">＋</span> New document
          </button>
        </div>
      </header>

      <main className="dash-body">
        <div className="dash-head">
          <div>
            <h1 className="dash-h1">All documents</h1>
            <p className="dash-count">{sheets.length} documents</p>
          </div>
          {sheets.length > 0 && (
            <div className="search">
              <span className="search-ic">🔍</span>
              <input
                placeholder="Search by name / Part No. / Model…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Empty state — the real "first open" experience */}
        {sheets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-art">📄</div>
            <h2>No documents yet</h2>
            <p>Start by creating your first Technical Sheet</p>
            <div className="empty-actions">
              <button className="btn primary lg" onClick={() => handleNew(false)}>
                <span className="ic">＋</span> Create blank document
              </button>
              <button className="btn ghost lg" onClick={() => handleNew(true)}>
                Start from example
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-art">🔍</div>
            <h2>No documents found</h2>
            <p>Try another search term or clear the search box</p>
          </div>
        ) : (
          <div className="card-grid">
            {groups.map((g) => (
              <ModelCard
                key={g.model}
                model={g.model}
                sheets={g.list}
                onOpen={(id) => navigate(`/sheet/${id}`)}
                onDeleteGroup={handleDeleteGroup}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// One card per MODEL. Opens the latest part; switch between parts inside the editor.
function ModelCard({ model, sheets, onOpen, onDeleteGroup }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)
  const latest = sheets[0]

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  return (
    <article className="doc-card model-card" ref={ref}>
      <div className="doc-card-top">
        <span className="doc-badge">MODEL</span>
        <div className="model-right">
          <span className="model-count">{sheets.length} part</span>
          <button className="doc-menu-btn" onClick={() => setMenuOpen((o) => !o)}>⋯</button>
          {menuOpen && (
            <div className="doc-menu">
              <button className="danger" onClick={() => { setMenuOpen(false); onDeleteGroup(sheets) }}>
                Delete group ({sheets.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="doc-title model-name" onClick={() => onOpen(latest.id)}>{model}</h3>
      <dl className="doc-meta">
        <div><dt>Parts</dt><dd>{sheets.length}</dd></div>
        <div><dt>Last edited</dt><dd>{fmtDate(latest.updatedAt)}</dd></div>
      </dl>
      <button className="btn sm open-btn" onClick={() => onOpen(latest.id)}>Open document</button>
    </article>
  )
}
