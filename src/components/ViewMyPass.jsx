import { useState, useRef, useEffect } from 'react'
import { getPassByDobAndPhone } from '../lib/api.js'
import { dobToInputValue, dobFromInputValue } from '../lib/dateUtils.js'
import PassDisplay from './PassDisplay.jsx'

/**
 * View my pass: pass is shown directly below the form in the same page (no iframe).
 * Same idea as Admin "Verify pass" — inline. Uses PassDisplay with Print / Save option.
 */
export default function ViewMyPass() {
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pass, setPass] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const passContainerRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setPass(null)
    setNotFound(false)
    setLoading(true)
    getPassByDobAndPhone(dob.trim(), phone.trim())
      .then((data) => {
        if (data && data.error) {
          setNotFound(true)
          return
        }
        if (data && data.passId) {
          setPass(data)
        } else {
          setNotFound(true)
        }
      })
      .catch((err) => setError(err.message || 'Something went wrong'))
      .finally(() => setLoading(false))
  }

  function handlePrint() {
    window.print()
  }

  // Scroll pass into view when it loads (same page, below form)
  useEffect(() => {
    if (pass && passContainerRef.current) {
      passContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pass])

  return (
    <section className="view-pass-section">
      <h2>View my pass</h2>
      <p>Enter your date of birth and mobile number to see your pass.</p>

      <form onSubmit={handleSubmit} className="view-pass-form">
        <label className="field">
          <span>Date of birth</span>
          <input
            type="date"
            value={dobToInputValue(dob)}
            onChange={(e) => setDob(dobFromInputValue(e.target.value))}
            required
          />
        </label>
        <label className="field">
          <span>Mobile number</span>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Loading…' : 'Show my pass'}
        </button>
      </form>

      {notFound && <p className="not-found">No pass found for this date of birth and mobile number.</p>}
      <div ref={passContainerRef}>
        {pass && <PassDisplay pass={pass} onPrint={handlePrint} showPassId={false} />}
      </div>
    </section>
  )
}
