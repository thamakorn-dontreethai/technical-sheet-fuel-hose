// The interactive Technical Sheet. Inputs are bound through react-hook-form, so
// the whole form is one uncontrolled tree that submits as a single JSON object.
// Layout mirrors the printed FM-PE30/FPE-A-027 form as closely as a web grid allows.
import { memo } from 'react'
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import flareDiagram from './assets/flare-diagram.png'

// Generic editable value cell. Looks like plain text until you click it.
// Pulls `register` from form context so call sites only need a field name.
function V({ name, placeholder = '', align = 'center' }) {
  const { register } = useFormContext()
  return (
    <input
      type="text"
      className="cell-input"
      style={{ textAlign: align }}
      placeholder={placeholder}
      {...register(name)}
    />
  )
}

// Process sections live inside the 2-column body-split.
const SPLIT_SECTIONS = ['cut', 'flare', 'heat', 'leak', 'inspect', 'sketch']

function TechnicalSheet({ activeSection = 'header' }) {
  const { control, setValue, register } = useFormContext()
  const revise = useFieldArray({ control, name: 'reviseRecord' })
  const training = useFieldArray({ control, name: 'trainingRecord' })

  // When editing, only the active section shows (CSS). 'is-active' marks it.
  const act = (key) => (activeSection === key ? 'is-active' : '')

  // Sketch images live in form state as data-urls.
  const sketchBefore = useWatch({ control, name: 'sketchBefore' })
  const sketchAfter = useWatch({ control, name: 'sketchAfter' })

  const addRevise = () => revise.append({ no: '', date: '', detail: '', pe: '', prod: '', qa: '' })
  const addTraining = () => training.append({ date: '', trainer: '', trainee: '' })

  const pickImage = (key) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setValue(key, reader.result, { shouldDirty: true })
    reader.readAsDataURL(file)
  }

  return (
    <div className="sheet">
      {/* ============ TITLE BAR ============ */}
      <table id="sec-header" data-section="header" className={`grid title-grid ${act('header')}`}>
        <tbody>
          <tr>
            <td className="title-cell" rowSpan={2}>
              <div className="title-main">TECHNICAL SHEET</div>
              <div className="title-sub">FUEL HOSE</div>
            </td>
            <td className="hdr">APPROVE</td>
            <td className="hdr">CHECK</td>
            <td className="hdr">ISSUED BY</td>
          </tr>
          <tr>
            <td className="sign"><V name="approve" /></td>
            <td className="sign"><V name="check" /></td>
            <td className="sign"><V name="issuedBy" /></td>
          </tr>
        </tbody>
      </table>

      {/* ============ META ============ */}
      <table data-section="header" className={`grid meta-grid ${act('header')}`}>
        <tbody>
          <tr>
            <td className="lbl">MODEL</td>
            <td className="val"><V name="model" /></td>
            <td className="lbl">CODE</td>
            <td className="val"><V name="code" placeholder="Select part no." /></td>
            <td className="lbl">DOCUMENT No.</td>
            <td className="val"><V name="documentNo" /></td>
          </tr>
          <tr>
            <td className="lbl">PART No.</td>
            <td className="val" colSpan={3}><V name="partNo" placeholder="Select part No." /></td>
            <td className="lbl">ISSUED DATE</td>
            <td className="val"><V name="issuedDate" placeholder="Auto: today" /></td>
          </tr>
          <tr>
            <td className="lbl">PART NAME</td>
            <td className="val" colSpan={3}><V name="partName" /></td>
            <td className="lbl">REVISION No.</td>
            <td className="val"><V name="revisionNo" /></td>
          </tr>
        </tbody>
      </table>

      {/* ============ COMPONENT ============ */}
      <table id="sec-component" data-section="component" className={`grid component-grid ${act('component')}`}>
        <tbody>
          {[
            ['TUBE', 'tube', 'tubePartNo', 'PART No.', 'PROTECTOR', 'protector3', 'protector3PartNo', 'PART No. (#3)'],
            ['JOINT TUBE', 'jointTube', 'jointTubePartNo', 'PART No.', 'JOINT FUEL', 'jointFuel', 'jointFuelPartNo', 'PART No.'],
            ['PROTECTOR', 'protector1', 'protector1PartNo', 'PART No. (#1)', 'PROTECTOR', 'protector2', 'protector2PartNo', 'PART No. (#2)'],
            ['CAP', 'cap', 'capPartNo', 'PART No.', 'O-RING', 'oring', 'oringPartNo', 'PART No.'],
            ['TAP', 'tap', 'tapPartNo', 'PART No.', 'STICKER', 'sticker', 'stickerPartNo', 'PART No.'],
          ].map(([lL, lName, lPart, lPartLbl, rL, rName, rPart, rPartLbl], i) => (
            <PairRows key={i} tag={i === 0}
              leftLabel={lL} leftName={lName} leftPart={lPart}
              rightLabel={rL} rightName={rName} rightPart={rPart}
              partLeftLabel={lPartLbl} partRightLabel={rPartLbl}
            />
          ))}
        </tbody>
      </table>

      {/* ============ MAIN BODY : left process column + right sketch column ============ */}
      <div id="sec-process" className={`body-split ${SPLIT_SECTIONS.includes(activeSection) ? 'split-active' : ''}`}>
        {/* ---------- LEFT ---------- */}
        <div className="body-left">
          {/* (1) HOSE CUTTING */}
          <table data-section="cut" className={`grid proc-grid ${act('cut')}`}>
            <tbody>
              <tr>
                <td className="step-tag" rowSpan={3}><span>① HOSE CUTTING</span></td>
                <td className="lbl wide">PRINT OF TUBE</td>
                <td className="val"><V name="printOfTube" align="left" /></td>
              </tr>
              <tr>
                <td className="lbl wide">TUBE (ID.)</td>
                <td className="val"><div className="vu"><V name="tubeId" /><span className="unit">mm.</span></div></td>
              </tr>
              <tr>
                <td className="lbl wide">LENGTH OF TUBE</td>
                <td className="val"><div className="vu"><V name="lengthOfTube" /><span className="unit">mm.</span></div></td>
              </tr>
            </tbody>
          </table>

          {/* (2) FLARE & INSERTION */}
          <table data-section="flare" className={`grid proc-grid flare-grid ${act('flare')}`}>
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '42%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <tbody>
              {/* diagram + A / B / C */}
              <tr>
                <td className="step-tag" rowSpan={17}><span>② FLARE &amp; INSERTION ( MACHINE NO. )</span></td>
                <td className="flare-diagram" colSpan={2} rowSpan={3}><FlareDiagram /></td>
                <td className="lbl c">A</td>
                <td className="val"><V name="dimA" /></td>
                <td className="unit-cell">mm.</td>
              </tr>
              <tr>
                <td className="lbl c">B</td>
                <td className="val"><V name="dimB" /></td>
                <td className="unit-cell">mm.</td>
              </tr>
              <tr>
                <td className="lbl c">C</td>
                <td className="val"><V name="dimC" /></td>
                <td className="unit-cell">mm.</td>
              </tr>

              {/* FLARE TEMP : SET / Actual */}
              <tr>
                <td className="lbl c">FLARE</td>
                <td className="lbl c">SET</td>
                <td className="val"><V name="flareTempSet" /></td>
                <td className="unit-cell">°C</td>
              </tr>
              <tr>
                <td className="lbl c">TEMP.</td>
                <td className="lbl c">Actual</td>
                <td className="val"><V name="flareTempActual" /></td>
                <td className="unit-cell">°C</td>
              </tr>

              {/* AIR SUPPLY */}
              <tr>
                <td className="lbl" colSpan={3}>AIR SUPPLY PRESSURE</td>
                <td className="val"><V name="flareAirPressure" /></td>
                <td className="unit-cell">MPa.</td>
              </tr>

              {/* ITEM / JIG NO. header */}
              <tr className="item-hdr">
                <td className="lbl c" colSpan={3}>ITEM</td>
                <td className="lbl c" colSpan={2}>JIG NO.</td>
              </tr>

              {/* FLARE sub-section */}
              <tr>
                <td className="sub-tag" rowSpan={2}><span>FLARE</span></td>
                <td className="lbl" colSpan={2}>FLARING JIG ( JOINT POS. )</td>
                <td className="val" colSpan={2}><V name="flaringJigJoint" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>FLARING JIG ( CONNECTOR POS.)</td>
                <td className="val" colSpan={2}><V name="flaringJigConnector" /></td>
              </tr>

              {/* INSERT sub-section. LUBRICANTS NAME : and DAPHNE ALPHA CLEANER H are
                  two static lines inside ONE cell (not an input). */}
              <tr>
                <td className="sub-tag" rowSpan={8}><span>INSERT</span></td>
                <td className="lbl lubricant-cell" colSpan={2} rowSpan={2}>
                  <div className="lub-line1">LUBRICANTS NAME :</div>
                  <div className="lub-line2">DAPHNE ALPHA CLEANER H</div>
                </td>
                <td className="val area-ctrl" colSpan={2} rowSpan={2}><AreaControl /></td>
              </tr>
              <tr aria-hidden="true"></tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG SUPPORT JOINT FUEL</td>
                <td className="val" colSpan={2}><V name="jigSupportJointFuel" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG SUPPORT JOINT TUBE</td>
                <td className="val" colSpan={2}><V name="jigSupportJointTube" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG CLAMP PROTECTOR #1</td>
                <td className="val" colSpan={2}><V name="jigClampProtector1" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG CLAMP PROTECTOR #2</td>
                <td className="val" colSpan={2}><V name="jigClampProtector2" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG CLAMP PROTECTOR MIDDLE</td>
                <td className="val" colSpan={2}><V name="jigClampProtectorMiddle" /></td>
              </tr>
              <tr>
                <td className="lbl" colSpan={2}>JIG LUBRICANT FEEDER ( ALL )</td>
                <td className="val" colSpan={2}><V name="jigLubricantFeeder" /></td>
              </tr>
            </tbody>
          </table>

          {/* (4) LEAK TEST */}
          <table data-section="leak" className={`grid proc-grid ${act('leak')}`}>
            <tbody>
              <tr>
                <td className="step-tag" rowSpan={3}><span>④ LEAK TEST</span></td>
                <td className="lbl wide">LEAK LIMIT / PRESS</td>
                <td className="val"><V name="leakLimitPress" align="left" /></td>
              </tr>
              <tr><td className="lbl wide">LEAK TEST JIG</td><td className="val"><V name="leakTestJig" /></td></tr>
              <tr>
                <td className="lbl wide">TEST CHANNEL / AIR SUPPLY</td>
                <td className="val">
                  <div className="vu">
                    <V name="testChannel" />
                    <span className="unit">/</span>
                    <V name="testChannelPressure" />
                    <span className="unit">MPa.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="body-right">
          {/* PART SKETCH */}
          <div id="sec-sketch" data-section="sketch" className={`sketch-box ${act('sketch')}`}>
            <div className="sketch-title">PART SKETCH</div>
            <SketchSlot label="BEFORE BENDING" value={sketchBefore} onPick={pickImage('sketchBefore')} onClear={() => setValue('sketchBefore', '', { shouldDirty: true })} />
            <SketchSlot label="AFTER BENDING" value={sketchAfter} onPick={pickImage('sketchAfter')} onClear={() => setValue('sketchAfter', '', { shouldDirty: true })} />
          </div>

          {/* (3) HEATING & BENDING */}
          <table data-section="heat" className={`grid proc-grid ${act('heat')}`}>
            <tbody>
              <tr><td className="step-tag center-tag" colSpan={2}>③ HEATING &amp; BENDING</td></tr>
              <tr><td className="lbl wide">AIR SUPPLY PRESSURE</td><td className="val"><div className="vu"><V name="heatAirPressure" /><span className="unit">MPa.</span></div></td></tr>
              <tr><td className="lbl wide">MACHINE NO.</td><td className="val"><V name="heatMachineNo" /></td></tr>
              <tr><td className="lbl wide">PROTECTOR SWITCH</td><td className="val"><V name="protectorSwitch" /></td></tr>
              <tr><td className="lbl wide">SETING TEMP.</td><td className="val"><div className="vu"><V name="setingTemp" /><span className="unit">°C</span></div></td></tr>
              <tr><td className="lbl wide">SURFACE JIG TEMP</td><td className="val"><div className="vu"><V name="surfaceJigTemp" /><span className="unit">°C</span></div></td></tr>
              <tr><td className="lbl wide">HEATING JIG NO.</td><td className="val"><V name="heatingJigNo" /></td></tr>
              <tr><td className="lbl wide">BENDING JIG NO.</td><td className="val"><V name="bendingJigNo" /></td></tr>
            </tbody>
          </table>

          {/* (5) INSPECTION */}
          <table data-section="inspect" className={`grid proc-grid ${act('inspect')}`}>
            <tbody>
              <tr><td className="step-tag center-tag" colSpan={2}>⑤ INSPECTION</td></tr>
              <tr><td className="lbl wide">INSPECTION GAUGE</td><td className="val"><V name="inspectionGauge" /></td></tr>
              <tr><td className="lbl wide">TOL. OF SHAPE PART</td><td className="val"><V name="tolOfShape" /></td></tr>
              <tr><td className="lbl wide">COLOR MARK</td><td className="val"><V name="colorMark" /></td></tr>
              <tr><td className="lbl wide">QUANTITY MARK</td><td className="val"><V name="quantityMark" /></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ REVISE RECORD ============ */}
      <div id="sec-records" data-section="records" className={`records ${act('records')}`}>
        <div className="record-block">
          <div className="record-title">
            REVISE RECORD
            <button className="add-row no-print" onClick={addRevise}>+ row</button>
          </div>
          <table className="grid record-grid">
            <thead>
              <tr>
                <th>No.</th><th>Date</th><th className="detail-col">Description of Revision</th>
                <th>PE.</th><th>PROD.</th><th>QA.</th>
              </tr>
            </thead>
            <tbody>
              {revise.fields.map((f, i) => (
                <tr key={f.id}>
                  <td><input className="cell-input" {...register(`reviseRecord.${i}.no`)} /></td>
                  <td><input className="cell-input" {...register(`reviseRecord.${i}.date`)} /></td>
                  <td><input className="cell-input" style={{ textAlign: 'left' }} {...register(`reviseRecord.${i}.detail`)} /></td>
                  <td><input className="cell-input" {...register(`reviseRecord.${i}.pe`)} /></td>
                  <td><input className="cell-input" {...register(`reviseRecord.${i}.prod`)} /></td>
                  <td><input className="cell-input" {...register(`reviseRecord.${i}.qa`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="record-block training">
          <div className="record-title">
TRAINING RECORD
            <button className="add-row no-print" onClick={addTraining}>+ row</button>
          </div>
          <table className="grid record-grid">
            <thead>
              <tr><th>Date</th><th>Trainer</th><th>Trainee</th></tr>
            </thead>
            <tbody>
              {training.fields.map((f, i) => (
                <tr key={f.id}>
                  <td><input className="cell-input" {...register(`trainingRecord.${i}.date`)} /></td>
                  <td><input className="cell-input" {...register(`trainingRecord.${i}.trainer`)} /></td>
                  <td><input className="cell-input" {...register(`trainingRecord.${i}.trainee`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div data-section="records" className={`form-footer ${act('records')}`}>FM-PE30/FPE-A-027 Rev.01 (28/06/16)</div>
    </div>
  )
}

// Two stacked rows in the component table: "name" row then "PART No." row.
function PairRows({ tag, leftLabel, leftName, leftPart, rightLabel, rightName, rightPart, partLeftLabel, partRightLabel }) {
  const hasRight = !!rightName
  return (
    <>
      <tr>
        {tag && <td className="section-tag" rowSpan={10}>COMPONENT</td>}
        <td className="lbl">{leftLabel}</td>
        <td className="val"><V name={leftName} /></td>
        <td className="lbl">{rightLabel}</td>
        <td className="val">{hasRight && <V name={rightName} />}</td>
      </tr>
      <tr>
        <td className="lbl sub">{partLeftLabel}</td>
        <td className="val"><V name={leftPart} /></td>
        <td className="lbl sub">{partRightLabel}</td>
        <td className="val">{hasRight && <V name={rightPart} />}</td>
      </tr>
    </>
  )
}

function SketchSlot({ label, value, onPick, onClear }) {
  return (
    <div className="sketch-slot">
      <div className="sketch-slot-label">{label}</div>
      {value ? (
        <div className="sketch-img-wrap">
          <img src={value} alt={label} />
          <button className="sketch-clear no-print" onClick={onClear}>✕</button>
        </div>
      ) : (
        <label className="sketch-drop no-print">
          <span>Click to add image</span>
          <input type="file" accept="image/*" onChange={onPick} hidden />
        </label>
      )}
    </div>
  )
}

// Flare cross-section drawing (left side of section ②): the actual reference
// diagram from the technical sheet — flared tube profile + end-view ellipse (Ø A, B, C).
function FlareDiagram() {
  return <img src={flareDiagram} className="flare-svg" alt="flare cross-section (Ø A, B, C)" />
}

// Small "AREA CONTROL : 1-5 mm." apply-area sketch next to LUBRICANTS NAME.
function AreaControl() {
  return (
    <div className="area-ctrl-box">
      <div className="ac-title">AREA CONTROL : 1 - 5 mm.</div>
      <svg viewBox="0 0 90 34" className="ac-svg" role="img" aria-label="apply area">
        <path d="M10,30 L26,6 L64,6 L80,30 Z" fill="none" stroke="#111" strokeWidth="1" />
        <line x1="26" y1="6" x2="26" y2="30" stroke="#2563eb" strokeWidth="1" />
        <line x1="64" y1="6" x2="64" y2="30" stroke="#2563eb" strokeWidth="1" />
        <text x="40" y="22" className="fl-t">Apply</text>
      </svg>
    </div>
  )
}

// Memoized so it only re-renders from its own form subscriptions, not when the
// editor app bar re-renders (e.g. live title via watch()).
export default memo(TechnicalSheet)
