/******************************************************************************
 * BACKEND PARA O HTML "STATUS DE CONTRATAÇÃO DOS MODERADORES"
 *
 * Como usar:
 * 1) Crie uma Google Sheets.
 * 2) Vá em Extensões > Apps Script.
 * 3) Cole este código no editor.
 * 4) Clique em Implantar > Nova implantação > App da Web.
 * 5) Execute como: você mesmo.
 * 6) Quem tem acesso: qualquer pessoa.
 * 7) Copie a URL do Web App e cole no CONFIG.WEB_APP_URL do HTML.
 ******************************************************************************/

const SPREADSHEET_ID = ''; // Se o script estiver vinculado à planilha, pode deixar vazio.
const SHEET_NAME = 'status_moderadores_reset_2026_06_25';

const HEADERS = [
  'updateId',
  'serverTimestamp',
  'clientTimestamp',
  'doctorId',
  'doctorName',
  'representative',
  'status',
  'pendingReason',
  'nextAction',
  'targetDate',
  'notes',
  'answeredBy',
  'sourcePage'
];

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'list');
    if (action !== 'list') {
      return output_({ ok: false, error: 'Ação inválida.' }, e.parameter.callback);
    }
    return output_({ ok: true, records: getRecords_() }, e.parameter.callback);
  } catch (error) {
    return output_({ ok: false, error: String(error && error.message ? error.message : error) }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const payloadText = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const payload = JSON.parse(payloadText);
    const sheet = ensureSheet_();
    const updateId = Utilities.getUuid();
    const now = new Date();

    const row = [
      updateId,
      now,
      payload.clientTimestamp || '',
      payload.doctorId || '',
      payload.doctorName || '',
      payload.representative || '',
      payload.status || '',
      payload.pendingReason || '',
      payload.nextAction || '',
      payload.targetDate || '',
      payload.notes || '',
      payload.answeredBy || '',
      payload.sourcePage || ''
    ];

    sheet.appendRow(row);

    return output_({
      ok: true,
      updateId: updateId,
      serverTimestamp: now.toISOString()
    }, e && e.parameter && e.parameter.callback);
  } catch (error) {
    return output_({ ok: false, error: String(error && error.message ? error.message : error) }, e && e.parameter && e.parameter.callback);
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function getRecords_() {
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== '')).map(row => {
    const record = {};
    headers.forEach((header, index) => {
      const value = row[index];
      if (value instanceof Date) {
        record[header] = value.toISOString();
      } else {
        record[header] = value;
      }
    });
    record.id = record.updateId;
    return record;
  }).sort((a, b) => new Date(b.serverTimestamp || b.clientTimestamp || 0) - new Date(a.serverTimestamp || a.clientTimestamp || 0));
}

function ensureSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Nenhuma planilha ativa encontrada. Vincule o script a uma Google Sheets ou preencha SPREADSHEET_ID.');
  }
  return spreadsheet;
}


/**
 * Opcional: execute manualmente esta função no Apps Script se quiser limpar
 * todas as respostas da aba configurada em SHEET_NAME, mantendo apenas o cabeçalho.
 * Esta função NÃO é exposta publicamente pelo Web App.
 */
function zerarSubmissoesManualmente_() {
  const sheet = ensureSheet_();
  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    const safeCallback = String(callback).replace(/[^\w.$]/g, '');
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
