/**
 * Admin login logic. Hardcoded fallback for testing lives here (not in Apps Script).
 * Remove or change HARDCODED_ADMIN_* for production.
 */

export const HARDCODED_ADMIN_USER = 'admin'
export const HARDCODED_ADMIN_PASS = 'admin123'

/**
 * Returns true if the given credentials match the hardcoded test admin.
 * Used so we can skip the server call when testing with admin/admin123.
 */
export function isHardcodedAdmin(username, password) {
  const u = (username || '').toString().trim()
  const p = (password || '').toString()
  return u === HARDCODED_ADMIN_USER && p === HARDCODED_ADMIN_PASS
}
