// Data model for the Fuel Hose Technical Sheet.
// One flat object = one sheet. Every key maps to an editable cell in the form.
// Backend logic comes later; for the demo we persist to localStorage.

// Today's date in the M/D/YYYY format the form uses (e.g. 6/20/2026).
export const todayStr = () => new Date().toLocaleDateString('en-US')

export const blankSheet = () => ({
  // --- Header ---
  model: '',
  code: '',
  documentNo: '',
  partNo: '',
  issuedDate: todayStr(), // ISSUED DATE defaults to current date
  partName: '',
  revisionNo: '',
  approve: '',
  check: '',
  issuedBy: '',

  // --- Component (name + part no.) — FM-PE30 standard layout ---
  tube: '', tubePartNo: '',
  protector3: '', protector3PartNo: '',
  jointTube: '', jointTubePartNo: '',
  jointFuel: '', jointFuelPartNo: '',
  protector1: '', protector1PartNo: '',
  protector2: '', protector2PartNo: '',
  cap: '', capPartNo: '',
  oring: '', oringPartNo: '',
  tap: '', tapPartNo: '',
  sticker: '', stickerPartNo: '',

  // --- (1) Hose cutting ---
  printOfTube: '',
  tubeId: '',
  lengthOfTube: '',

  // --- (2) Flare & insertion ---
  dimA: '', dimB: '', dimC: '',
  flareTempSet: '', flareTempActual: '',
  flareAirPressure: '',
  flaringJigJoint: '', flaringJigConnector: '',
  lubricantName: 'DAPHNE ALPHA CLEANER H',
  jigSupportJointFuel: '',
  jigSupportJointTube: '',
  jigClampProtector1: '',
  jigClampProtector2: '',
  jigClampProtectorMiddle: '',
  jigLubricantFeeder: '',

  // --- (3) Heating & bending ---
  heatAirPressure: '',
  heatMachineNo: '',
  protectorSwitch: '',
  setingTemp: '',
  surfaceJigTemp: '',
  heatingJigNo: '',
  bendingJigNo: '',

  // --- (4) Leak test ---
  leakLimitPress: '',
  leakTestJig: '',
  testChannel: '',
  testChannelPressure: '',

  // --- (5) Inspection ---
  inspectionGauge: '',
  tolOfShape: '',
  colorMark: '',
  quantityMark: '',

  // --- Part sketch (image data-urls, optional) ---
  sketchBefore: '',
  sketchAfter: '',

  // --- Revise record (array of rows) ---
  reviseRecord: [
    { no: '', date: '', detail: '', pe: '', prod: '', qa: '' },
  ],

  // --- Training record ---
  trainingRecord: [
    { date: '', trainer: '', trainee: '' },
  ],
})

// Filled example (part 77204-0G040, rev 02) in the FM-PE30 standard layout.
export const exampleSheet = () => ({
  ...blankSheet(),

  model: '500D',
  code: 'F124',
  documentNo: 'TC-PE30/FPE-B-079',
  partNo: '77204 - 0G040 - A',
  issuedDate: '5/23/2026',
  partName: 'TUBE SUB-ASSY, FUEL TANK RETURN',
  revisionNo: '02',

  tube: 'GH319-85420-A (L = 802 mm.)', tubePartNo: 'U078',
  protector3: 'GH092-29960', protector3PartNo: 'PZ35',
  jointTube: '9-33989-99010-H', jointTubePartNo: 'I617',
  jointFuel: '77244-32010-A', jointFuelPartNo: 'I632',
  protector1: 'GH099-78820-A (L = 189 mm.)', protector1PartNo: 'R006',
  protector2: 'GH099-78860-A (L = 136 mm.)', protector2PartNo: 'R012',
  cap: '33993-47010-B', capPartNo: 'T913',
  oring: '33995-21020-E', oringPartNo: 'I620',
  tap: '9-59359-00250', tapPartNo: 'TP20',
  sticker: 'GF999-14380', stickerPartNo: 'TP75',

  printOfTube: 'TG FUEL >PA11< DD.MM.YY',
  tubeId: 'Ø 6  x  t = 1',
  lengthOfTube: '802 ± 2',

  dimA: '11 ± 0.4', dimB: '4 ± 2', dimC: 'MAX 1.5',
  flareTempSet: '130 ± 5', flareTempActual: '122 - 134',
  flareAirPressure: '0.4 - 0.7',
  flaringJigJoint: 'COMMON ALL', flaringJigConnector: 'COMMON ALL',
  lubricantName: 'DAPHNE ALPHA CLEANER H',
  jigSupportJointFuel: '77244-32010',
  jigSupportJointTube: '9-33989-99010',
  jigClampProtector1: '77204-0G040',
  jigClampProtector2: '77204-0G040',
  jigClampProtectorMiddle: 'JIG Ø 8 mm.',
  jigLubricantFeeder: 'JIG Ø 8 mm.',

  heatAirPressure: '0.4 - 0.7',
  heatMachineNo: '',
  protectorSwitch: 'New (Heat 120s., Cool 45s.)',
  setingTemp: '168 ± 5',
  surfaceJigTemp: '153 - 163',
  heatingJigNo: '77204-0G040',
  bendingJigNo: '77204-0G040',

  leakLimitPress: '-0.3 - (+1.5) ml.   510 ± 10 kPa.',
  leakTestJig: '77204-0G040',
  testChannel: '1',
  testChannelPressure: '0.5 - 0.7',

  inspectionGauge: '77204-0G040',
  tolOfShape: '± 4 mm. MAX.',
  colorMark: 'White',
  quantityMark: '1',

  reviseRecord: [
    { no: '2', date: '5/23/2026', detail: 'Revise air pressure & surface jig temp', pe: 'Paisarn', prod: 'Winai', qa: 'Voraphot' },
    { no: '1', date: '3/19/2026', detail: 'Addition daphne no. & area apply daphne', pe: 'Paisarn', prod: 'Winai', qa: 'Voraphot' },
    { no: '-', date: '6/15/2025', detail: 'First issue', pe: 'Sumet', prod: 'Jirapong', qa: 'Voraphot' },
  ],

  trainingRecord: [
    { date: '', trainer: '', trainee: '' },
  ],
})
