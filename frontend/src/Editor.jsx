import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import TechnicalSheet from './TechnicalSheet'
import { blankSheet, getSheet, saveSheet, sheetTitle, findDuplicate, useSheets, createSheetFromData } from './sheetStore'

// Section anchors for the in-editor quick nav (recognition over recall).
const SECTIONS = [
  ['header', 'ข้อมูลเอกสาร'],
  ['component', 'ส่วนประกอบ'],
  ['process', 'กระบวนการผลิต'],
  ['sketch', 'แบบชิ้นงาน'],
  ['records', 'บันทึกการแก้ไข'],
]

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const methods = useForm({ defaultValues: blankSheet() })
  const { isDirty } = methods.formState
  const [notFound, setNotFound] = useState(false)
  const [ready, setReady] = useState(false)
  const [preview, setPreview] = useState(false)
  const sheets = useSheets()
  const currentModel = methods.watch('model')

  // Other parts that share this document's MODEL — for the top Part No. switcher.
  const partOptions = useMemo(() => {
    const m = (currentModel || '').trim().toLowerCase()
    return [...sheets]
      .filter((s) => { const sm = (s.data.model || '').trim().toLowerCase(); return !m || sm === m })
      .sort((a, b) => (a.data.partNo || '').localeCompare(b.data.partNo || ''))
  }, [sheets, currentModel])

  // Load the record into the form.
  useEffect(() => {
    const rec = getSheet(id)
    if (!rec) { setNotFound(true); return }
    methods.reset(rec.data)
    setReady(true)
  }, [id, methods])

  // --- Save (manual; auto-save removed) ---
  const handleSave = () => {
    const values = methods.getValues()
    // Hard block: a document with the same PART No. + REVISION No. is not allowed.
    const dup = findDuplicate(values.partNo, values.revisionNo, id)
    if (dup) {
      alert(
        `บันทึกไม่ได้: มีเอกสาร Part No. "${values.partNo}" Rev. "${values.revisionNo}" อยู่แล้ว\n\n` +
          'กรุณาแก้ Part No. หรือ Revision No. ให้ไม่ซ้ำก่อนบันทึก',
      )
      return
    }
    saveSheet(id, values)
    methods.reset(values) // adopt saved values as the new clean baseline
  }

  // --- New document in the SAME model as the one currently open ---
  const handleNewInModel = () => {
    const rec = createSheetFromData({ model: methods.getValues('model') || '' })
    navigate(`/sheet/${rec.id}`)
  }

  // --- Warn on unsaved changes ---
  // 1) Tab close / refresh
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // 2) In-app navigation (e.g. back to dashboard)
  const blocker = useBlocker(() => isDirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?')) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])

  const partName = methods.watch('partName')
  const partNo = methods.watch('partNo')
  const title = sheetTitle({ partName, partNo })

  const scrollTo = (anchor) => {
    document.getElementById(`sec-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (notFound) {
    return (
      <div className="editor-missing">
        <div className="empty-art">🚫</div>
        <h2>ไม่พบเอกสารนี้</h2>
        <button className="btn primary" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
      </div>
    )
  }
  if (!ready) return <div className="editor-loading">กำลังโหลด…</div>

  const hasCurrent = partOptions.some((s) => s.id === id)

  return (
    <div className={`editor ${preview ? 'previewing' : ''}`}>
      {/* Export preview toolbar (overlay) */}
      {preview && (
        <div className="preview-bar no-print">
          <div className="preview-title">ตัวอย่างก่อน Export — {title}</div>
          <div className="preview-actions">
            <button className="btn" onClick={() => setPreview(false)}>✕ ปิด</button>
            <button className="btn primary" onClick={() => window.print()}>🖨️ พิมพ์ / บันทึก PDF</button>
          </div>
        </div>
      )}

      {/* App bar */}
      <header className="ed-bar no-print">
        <button className="back-btn" onClick={() => navigate('/')} title="กลับหน้าหลัก">←</button>
        <div className="ed-title-wrap">
          <div className="ed-title">{title}</div>
          <div className={`ed-status ${isDirty ? 'unsaved' : 'saved'}`}>
            {isDirty ? <>● มีการแก้ไขที่ยังไม่บันทึก</> : <>✓ บันทึกแล้ว</>}
          </div>
        </div>
        <div className="ed-actions">
          {/* Part No. switcher (same MODEL) */}
          <select
            className="partno-top"
            value={id}
            onChange={(e) => { if (e.target.value !== id) navigate(`/sheet/${e.target.value}`) }}
            title="เลือก Part No. (รุ่นเดียวกัน)"
          >
            {!hasCurrent && <option value={id}>{partNo || '(เอกสารนี้)'}</option>}
            {partOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.data.partNo || '—') + ' (Rev.' + (s.data.revisionNo || '-') + ')'}
              </option>
            ))}
          </select>

          <button className="btn ghost" onClick={handleNewInModel} title="สร้างเอกสาร Part No. ใหม่ ใน Model เดียวกัน">
            ＋ Part No. ใหม่
          </button>
          <button className="btn ghost" onClick={() => setPreview(true)}>👁️ Export</button>
          <button className="btn primary" onClick={handleSave} disabled={!isDirty}>💾 บันทึก</button>
        </div>
      </header>

      <div className="ed-layout">
        {/* Section nav */}
        <nav className="ed-nav no-print">
          <div className="ed-nav-label">ไปยังส่วน</div>
          {SECTIONS.map(([anchor, label]) => (
            <button key={anchor} onClick={() => scrollTo(anchor)}>{label}</button>
          ))}
        </nav>

        <div className="ed-canvas">
          <FormProvider {...methods}>
            <TechnicalSheet />
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
