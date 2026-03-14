/**
 * ISKCON Prayagraj Regular Pass - Google Apps Script Web App
 * Deploy as Web App: Execute as "Me", Who has access: "Anyone".
 *
 * Sheet 1: "Admin" - columns: Username (A), Password (B). Row 1 = headers, row 2+ = data.
 * Sheet 2: "Registrations" - columns: Timestamp (A), Pass ID (B), Name (C), Gender (D), Photo (E), Date of Birth (F), Phone (G), Email (H). Row 1 = headers.
 *
 * CORS: Apps Script does not support doOptions(), so the frontend sends POST with Content-Type: text/plain
 * (and body as JSON string) to avoid a preflight OPTIONS request. doPost still parses the body as JSON.
 */

function doPost(e) {
  try {
    // postData.contents is the raw body (frontend sends JSON string with Content-Type: text/plain to avoid CORS preflight)
    var raw = (e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = {};
    try {
      body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (parseErr) {
      return createJsonResponse(400, { error: 'Invalid JSON body' });
    }
    var action = body.action || '';
    var result = {};

    switch (action) {
      case 'adminLogin':
        result = handleAdminLogin(body);
        break;
      case 'getPass':
        result = handleGetPass(body);
        break;
      case 'register':
        result = handleRegister(body);
        break;
      case 'getPassById':
        result = handleGetPassById(body);
        break;
      default:
        result = { error: 'Unknown action', action: action };
    }

    return createJsonResponse(200, result);
  } catch (err) {
    return createJsonResponse(500, { error: 'Server error', message: err.toString() });
  }
}

/** Optional: health check or GET-based lookup */
function doGet(e) {
  var result = { ok: true, message: 'ISKCON Prayagraj Regular Pass API' };
  return createJsonResponse(200, result);
}

function createJsonResponse(statusCode, data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Get the spreadsheet. Use script property SPREADSHEET_ID if set (for standalone scripts).
 * Otherwise use getActiveSpreadsheet() (works only when script is bound to the sheet:
 * created via Extensions → Apps Script from the spreadsheet).
 */
function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getAdminSheet() {
  return getSpreadsheet().getSheetByName('Admin');
}

function getRegistrationsSheet() {
  return getSpreadsheet().getSheetByName('Registrations');
}

/** Generate short unique alphanumeric Pass ID (Option B): 8 chars */
function generatePassId() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid 0,O,1,I
  var id = '';
  for (var i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  var sheet = getRegistrationsSheet();
  var data = sheet.getDataRange().getValues();
  var existingIds = {};
  for (var r = 1; r < data.length; r++) {
    if (data[r][1]) existingIds[data[r][1]] = true;
  }
  if (existingIds[id]) return generatePassId();
  return id;
}

/** action: adminLogin. Body: { username, password } — checks Admin sheet only (no hardcoded fallback here). */
function handleAdminLogin(body) {
  var username = (body.username || '').toString().trim();
  var password = (body.password || '').toString().trim();

  var sheet = getAdminSheet();
  if (!sheet) return { success: false, error: 'Admin sheet not found' };

  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    var rowUser = (data[r][0] != null) ? String(data[r][0]).trim() : '';
    var rowPass = (data[r][1] != null) ? String(data[r][1]).trim() : '';
    if (rowUser === username && rowPass === password) {
      return { success: true };
    }
  }
  return { success: false };
}

/** Normalize phone: digits only */
function normalizePhone(phone) {
  if (phone == null) return '';
  return phone.toString().replace(/\D/g, '');
}

/**
 * Normalize DOB to DD/MM/YYYY for comparison. Sheet may store as Date or string.
 */
function toCanonicalDob(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    var d = value.getDate();
    var m = value.getMonth() + 1;
    var y = value.getFullYear();
    return (d < 10 ? '0' : '') + d + '/' + (m < 10 ? '0' : '') + m + '/' + y;
  }
  var s = value.toString().trim().replace(/\s/g, '');
  var digits = s.replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
  }
  return s;
}

/** action: getPass. Body: { dob, phone }. First filter by DOB, then by phone. */
function handleGetPass(body) {
  var dob = toCanonicalDob(body.dob);
  var phone = normalizePhone(body.phone);

  var sheet = getRegistrationsSheet();
  if (!sheet) return { error: 'not found' };

  var data = sheet.getDataRange().getValues();

  // Step 1: fetch all rows matching DOB
  var rowsByDob = [];
  for (var r = 1; r < data.length; r++) {
    var rowDob = toCanonicalDob(data[r][5]);
    if (rowDob === dob) {
      rowsByDob.push({ row: data[r], rowIndex: r + 1 });
    }
  }

  // Step 2: filter by mobile number and return first match
  for (var i = 0; i < rowsByDob.length; i++) {
    var rowPhone = normalizePhone(rowsByDob[i].row[6]);
    if (rowPhone === phone) {
      return rowToPassObject(rowsByDob[i].row, rowsByDob[i].rowIndex);
    }
  }

  return { error: 'not found' };
}

/** action: getPassById. Body: { passId } */
function handleGetPassById(body) {
  var passId = (body.passId || '').toString().trim();

  var sheet = getRegistrationsSheet();
  if (!sheet) return { error: 'not found' };

  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][1] === passId) {
      return rowToPassObject(data[r], r + 1);
    }
  }
  return { error: 'not found' };
}

/** Registrations row to object: timestamp, passId, name, gender, photo, dob, phone, email */
function rowToPassObject(row, rowIndex) {
  return {
    timestamp: row[0],
    passId: row[1],
    name: row[2] || '',
    gender: row[3] || '',
    photo: row[4] || '',
    dob: toCanonicalDob(row[5]) || (row[5] != null ? String(row[5]) : ''),
    phone: row[6] || '',
    email: row[7] || ''
  };
}

/** action: register. Body: { name, gender, photo, dob, phone, email } */
function handleRegister(body) {
  var name = (body.name || '').toString().trim();
  var gender = (body.gender || '').toString().trim();
  var photo = (body.photo || '').toString();
  var dob = (body.dob || '').toString().trim();
  var phone = (body.phone || '').toString().trim();
  var email = (body.email || '').toString().trim();

  if (!name) return { error: 'Name is required' };
  if (!dob) return { error: 'Date of birth is required' };
  if (!phone) return { error: 'Phone is required' };

  var passId = generatePassId();
  var timestamp = new Date();

  var sheet = getRegistrationsSheet();
  if (!sheet) return { error: 'Registrations sheet not found' };

  sheet.appendRow([timestamp, passId, name, gender, photo, dob, phone, email]);
  var lastRow = sheet.getLastRow();
  var row = sheet.getRange(lastRow, 1, lastRow, 8).getValues()[0];

  return rowToPassObject(row, lastRow);
}
