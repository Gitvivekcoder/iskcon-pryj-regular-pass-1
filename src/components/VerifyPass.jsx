import { useState } from 'react'
import { getPassById } from '../lib/api.js'

/** Admin-only: scan QR or enter pass ID → show full registration details */
export default function VerifyPass() {
  const [passId, setPassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const id = passId.trim()
    if (!id) return
    setError('')
    setDetails(null)
    setLoading(true)
    getPassById(id)
      .then((data) => {
        if (data.error === 'not found') {
          setError('No pass found with this ID.')
          return
        }
        setDetails(data)
      })
      .catch((err) => setError(err.message || 'Request failed'))
      .finally(() => setLoading(false))
  }

  return (
    <section className="verify-pass-section">
      <h3>Verify pass</h3>
      <p>Enter the pass ID (from the QR or pass) to view full registration details.</p>
      <form onSubmit={handleSubmit} className="verify-form">
        <label className="field">
          <span>Pass ID</span>
          <input
            type="text"
            placeholder="e.g. AB12CD34"
            value={passId}
            onChange={(e) => setPassId(e.target.value.toUpperCase().trim())}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Looking up…' : 'Verify'}
        </button>
      </form>
      {details && (
        <div className="verify-details">
          <h4>Pass details</h4>
          {details.photo && (
            <div className="verify-photo">
              <img src={details.photo} alt="" />
            </div>
          )}
          <dl>
            <dt>Pass ID</dt><dd>{details.passId}</dd>
            <dt>Name</dt><dd>{details.name || '—'}</dd>
            <dt>Gender</dt><dd>{details.gender || '—'}</dd>
            <dt>Date of birth</dt><dd>{details.dob || '—'}</dd>
            <dt>Phone</dt><dd>{details.phone || '—'}</dd>
            <dt>Email</dt><dd>{details.email || '—'}</dd>
          </dl>
        </div>
      )}
    </section>
  )
}
