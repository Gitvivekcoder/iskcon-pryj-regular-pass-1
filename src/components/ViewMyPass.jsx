import { useState, useRef, useEffect } from 'react'
import { getPassByDobAndPhone } from '../lib/api.js'
import PassDisplay from './PassDisplay.jsx'

/** Convert YYYY-MM-DD (from input type="date") to DD/MM/YYYY for API/sheet matching. */
function dateToDdMmYyyy(value) {
  if (!value || !value.trim()) return ''
  const [y, m, d] = value.trim().split('-')
  return [d, m, y].join('/')
}

/**
 * View my pass: pass is shown directly below the form in the same page (no iframe).
 * Same idea as Admin "Verify pass" — inline. Uses PassDisplay with Download option.
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
    getPassByDobAndPhone(dateToDdMmYyyy(dob), phone.trim())
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

  // Scroll pass into view when it loads (same page, below form)
  useEffect(() => {
    if (pass && passContainerRef.current) {
      passContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pass])

  return (
    <section className="view-pass-section">
      <h2>View my pass <span className="hindi">अपना पास देखें</span></h2>
      <p>Enter your date of birth and mobile number to see your pass. <span className="hindi">अपना पास देखने के लिए जन्म तारीख और मोबाइल नंबर दर्ज करें।</span></p>

      <form onSubmit={handleSubmit} className="view-pass-form">
        <label className="field">
          <span>Date of birth <span className="hindi">जन्म तारीख</span></span>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Mobile number <span className="hindi">मोबाइल नंबर</span></span>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="submit-wrap">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading…' : 'Show my pass'}
          </button>
          <span className="hindi btn-hindi">मेरा पास दिखाएं</span>
        </div>
      </form>

      {notFound && (
        <p className="not-found">
          No pass found for this date of birth and mobile number. <span className="hindi">इस जन्म तारीख और मोबाइल नंबर के लिए कोई पास नहीं मिला।</span>
        </p>
      )}
      <div ref={passContainerRef}>
        {pass && <PassDisplay pass={pass} showPassId={true} showHindi={true} />}
      </div>
    </section>
  )
}
