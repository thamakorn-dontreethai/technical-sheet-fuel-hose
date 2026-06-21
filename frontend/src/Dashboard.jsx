import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSheets, createSheet, createSheetFromData, deleteSheet, findDuplicate,
} from './sheetStore'
import { importAllSheets } from './excel'

function fmtDate(ts) {
  return new Date(ts).toLocaleString('th-TH', {
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
      const m = (s.data.model || '').trim() || '— ไม่ระบุ MODEL —'
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
    if (confirm(`ลบเอกสารทั้งหมดในกลุ่มนี้ (${list.length} รายการ) อย่างถาวร?`)) {
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
          'ไม่พบข้อมูลที่ตรงกับฟอร์มในไฟล์นี้\n\n' +
            'รองรับ: ไฟล์ Technical Sheet จริง (TC Format Rev.2) หรือไฟล์ 2 คอลัมน์ (กด "เทมเพลต Excel")',
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

      let msg = `สร้าง ${fresh.length} เอกสาร`
      if (skipped > 0) msg += `, ข้ามรายการซ้ำ ${skipped} (มีอยู่แล้ว)`
      alert('นำเข้าสำเร็จ: ' + msg)
    } catch (err) {
      alert('นำเข้าไฟล์ Excel ไม่สำเร็จ: ' + err.message)
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
            <div className="dash-brand-sub">ระบบจัดการเอกสารทางเทคนิค</div>
          </div>
        </div>
        <div className="dash-bar-actions">
          
          <label className="btn lg">
            📥 นำเข้า Excel
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImport}
              hidden
            />
          </label>
          <button className="btn primary lg" onClick={() => handleNew(false)}>
            <span className="ic">＋</span> สร้างเอกสารใหม่
          </button>
        </div>
      </header>

      <main className="dash-body">
        <div className="dash-head">
          <div>
            <h1 className="dash-h1">เอกสารทั้งหมด</h1>
            <p className="dash-count">{sheets.length} เอกสาร</p>
          </div>
          {sheets.length > 0 && (
            <div className="search">
              <span className="search-ic">🔍</span>
              <input
                placeholder="ค้นหาด้วยชื่อ / Part No. / Model…"
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
            <h2>ยังไม่มีเอกสาร</h2>
            <p>เริ่มต้นด้วยการสร้าง Technical Sheet ฉบับแรกของคุณ</p>
            <div className="empty-actions">
              <button className="btn primary lg" onClick={() => handleNew(false)}>
                <span className="ic">＋</span> สร้างเอกสารเปล่า
              </button>
              <button className="btn ghost lg" onClick={() => handleNew(true)}>
                เริ่มจากตัวอย่าง
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-art">🔍</div>
            <h2>ไม่พบเอกสารที่ค้นหา</h2>
            <p>ลองคำค้นอื่น หรือล้างช่องค้นหา</p>
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
                ลบทั้งกลุ่ม ({sheets.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="doc-title model-name" onClick={() => onOpen(latest.id)}>{model}</h3>
      <dl className="doc-meta">
        <div><dt>จำนวน Part</dt><dd>{sheets.length}</dd></div>
        <div><dt>แก้ไขล่าสุด</dt><dd>{fmtDate(latest.updatedAt)}</dd></div>
      </dl>
      <button className="btn sm open-btn" onClick={() => onOpen(latest.id)}>เปิดเอกสาร</button>
    </article>
  )
}
