import { useState } from 'react'
import { postToSheet, getApiEndpointLabel } from '../lib/api.js'
import { isHardcodedAdmin } from '../lib/adminLogic.js'

const DEBUG_STEP = {
  PENDING: 'pending',
  OK: 'ok',
  FAIL: 'fail',
}

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Temporary debug state (remove or hide in production)
  const [debugSteps, setDebugSteps] = useState([])
  const [debugRequest, setDebugRequest] = useState(null)
  const [debugResponse, setDebugResponse] = useState(null)
  const [debugError, setDebugError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setDebugError(null)
    setDebugResponse(null)
    setDebugRequest(null)

    const trimmedUser = username.trim()
    const endpoint = getApiEndpointLabel()

    // Step 1: Request prepared
    setDebugSteps([
      { id: 1, label: 'Prepare login request', status: DEBUG_STEP.OK, detail: `action: adminLogin, username: "${trimmedUser}" (length ${trimmedUser.length}), password: *** (length ${password.length})` },
      { id: 2, label: 'Send POST to server', status: DEBUG_STEP.PENDING, detail: `Endpoint: ${endpoint}` },
      { id: 3, label: 'Parse server response', status: DEBUG_STEP.PENDING, detail: null },
      { id: 4, label: 'Check credentials result', status: DEBUG_STEP.PENDING, detail: null },
    ])
    setDebugRequest({
      action: 'adminLogin',
      username: trimmedUser,
      password: '***',
      endpoint,
    })
    setLoading(true)

    // Hardcoded fallback (in React app): skip server if admin/admin123
    if (isHardcodedAdmin(trimmedUser, password)) {
      setDebugSteps((prev) => [
        ...prev.slice(0, 1),
        { id: 2, label: 'Send POST to server', status: DEBUG_STEP.OK, detail: 'Skipped — hardcoded admin matched (see adminLogic.js)' },
        { id: 3, label: 'Parse server response', status: DEBUG_STEP.OK, detail: 'Skipped' },
        { id: 4, label: 'Check credentials result', status: DEBUG_STEP.OK, detail: 'Hardcoded fallback → login OK' },
      ])
      setDebugResponse({ success: true, _source: 'hardcoded (adminLogic.js)' })
      onSuccess?.()
      setLoading(false)
      return
    }

    postToSheet({ action: 'adminLogin', username: trimmedUser, password })
      .then((data) => {
        setDebugResponse(data)
        setDebugSteps((prev) => [
          ...prev.slice(0, 1),
          { ...prev[1], status: DEBUG_STEP.OK, detail: 'Request completed' },
          { ...prev[2], status: DEBUG_STEP.OK, detail: `Response: ${JSON.stringify(data)}` },
          {
            id: 4,
            label: 'Check credentials result',
            status: data.success ? DEBUG_STEP.OK : DEBUG_STEP.FAIL,
            detail: data.success
              ? 'data.success === true → login OK'
              : `data.success is ${data.success}. ${data.error ? `Server message: "${data.error}"` : 'No error message from server.'} Script checks Admin sheet only (columns A=username, B=password).`,
          },
        ])
        if (data.success) {
          onSuccess?.()
        } else {
          setError(data.error || 'Invalid credentials')
        }
      })
      .catch((err) => {
        const msg = err.message || 'Login failed'
        setDebugError(msg)
        setDebugSteps((prev) => [
          ...prev.slice(0, 1),
          {
            ...prev[1],
            status: DEBUG_STEP.FAIL,
            detail: `Request failed: ${msg}. Check: network, CORS, .env VITE_SCRIPT_URL, proxy (dev).`,
          },
          { ...prev[2], status: DEBUG_STEP.PENDING, detail: 'Skipped (no response)' },
          { ...prev[3], status: DEBUG_STEP.PENDING, detail: 'Skipped' },
        ])
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  return (
    <section className="admin-login-section">
      <h2>Admin login</h2>
      <p className="admin-login-desc">
        Enter the admin username and password. In this app, a hardcoded test pair <code>admin</code> / <code>admin123</code> is
        checked first (see <code>src/lib/adminLogic.js</code>); if it matches, the server is not called. Otherwise credentials
        are sent to the Apps Script Web App and checked against the <strong>Admin</strong> sheet (columns A = Username, B = Password). Nothing is stored in the browser.
      </p>

      <form onSubmit={handleSubmit} className="admin-login-form">
        <label className="field">
          <span>Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Checking…' : 'Log in'}
        </button>
      </form>

      {/* Temporary debug panel — remove or hide in production */}
      <div className="admin-login-debug">
        <h3 className="debug-title">Debug: login flow</h3>
        <p className="debug-hint">Shows where the flow succeeded or failed. Remove this block for production.</p>

        {debugSteps.length > 0 && (
          <ol className="debug-steps">
            {debugSteps.map((s) => (
              <li key={s.id} className={`debug-step debug-step--${s.status}`}>
                <span className="debug-step-label">{s.label}</span>
                {s.detail && <span className="debug-step-detail">{s.detail}</span>}
              </li>
            ))}
          </ol>
        )}

        {debugRequest && (
          <div className="debug-block">
            <strong>Sent (password masked):</strong>
            <pre className="debug-pre">{JSON.stringify(debugRequest, null, 2)}</pre>
          </div>
        )}

        {debugResponse !== null && (
          <div className="debug-block">
            <strong>Server response (raw):</strong>
            <pre className="debug-pre">{JSON.stringify(debugResponse, null, 2)}</pre>
          </div>
        )}

        {debugError && (
          <div className="debug-block debug-block--error">
            <strong>Error (thrown or from response):</strong>
            <pre className="debug-pre">{debugError}</pre>
          </div>
        )}

        {!debugSteps.length && !debugRequest && !debugError && (
          <p className="debug-empty">Submit the form to see step-by-step debug.</p>
        )}
      </div>
    </section>
  )
}
