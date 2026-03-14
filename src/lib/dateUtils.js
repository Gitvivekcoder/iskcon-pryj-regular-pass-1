/**
 * DOB format: backend expects DD/MM/YYYY.
 * Native <input type="date"> uses YYYY-MM-DD. These helpers convert between them for UI only.
 */

/** DD/MM/YYYY → YYYY-MM-DD for use as value of <input type="date"> */
export function dobToInputValue(ddmmyyyy) {
  if (!ddmmyyyy || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ddmmyyyy.trim())) return ''
  const parts = ddmmyyyy.trim().split('/')
  const d = parts[0].padStart(2, '0')
  const m = parts[1].padStart(2, '0')
  const y = parts[2]
  return `${y}-${m}-${d}`
}

/** YYYY-MM-DD (from <input type="date">) → DD/MM/YYYY for state and API */
export function dobFromInputValue(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
