/**
 * Apps Script Web App URL. Set in .env as VITE_SCRIPT_URL.
 * In dev we use the Vite proxy (/api) so the request is same-origin and CORS is avoided
 * (Google strips Access-Control-Allow-Origin from the script response).
 */
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || ''
const API_BASE = import.meta.env.DEV ? '/api' : SCRIPT_URL

export function getScriptUrl() {
  return SCRIPT_URL
}

/** For debug UI: human-readable endpoint (no secrets). */
export function getApiEndpointLabel() {
  if (!SCRIPT_URL) return '— (VITE_SCRIPT_URL not set)'
  return import.meta.env.DEV ? '/api (Vite proxy → script)' : 'Script URL (direct)'
}

/**
 * POST JSON to the Apps Script Web App.
 * In dev: fetches /api (Vite proxies to script URL). In production: fetches script URL directly
 * (if you still see CORS in production, host the app behind a proxy that forwards to the script).
 * @param {Object} body - Must include { action: 'adminLogin' | 'getPass' | 'register' | 'getPassById', ... }
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function postToSheet(body) {
  if (!SCRIPT_URL) {
    throw new Error('VITE_SCRIPT_URL is not set. Add it to .env — see docs/SETUP-SHEET-AND-SCRIPT.md')
  }
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed: ${res.status}`)
  }
  return data
}

/**
 * Get pass by Pass ID (Admin verify pass).
 * @param {string} passId - Pass ID from QR or pass
 * @returns {Promise<Object>} Pass data or { error: 'not found' }
 */
export function getPassById(passId) {
  return postToSheet({ action: 'getPassById', passId: passId.trim() })
}

/**
 * Get pass by date of birth and mobile number (User view my pass).
 * Same pattern as getPassById; query uses two fields instead of passId.
 * @param {string} dob - Date of birth (e.g. DD/MM/YYYY)
 * @param {string} phone - Mobile number
 * @returns {Promise<Object>} Pass data or { error: 'not found' }
 */
export function getPassByDobAndPhone(dob, phone) {
  return postToSheet({ action: 'getPass', dob, phone })
}
