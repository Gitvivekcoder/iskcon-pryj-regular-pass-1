import { useState } from 'react'
import { postToSheet } from '../lib/api.js'

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmedUser = username.trim()
    setLoading(true)

    postToSheet({ action: 'adminLogin', username: trimmedUser, password })
      .then((data) => {
        if (data.success) {
          onSuccess?.()
        } else {
          setError(data.error || 'Invalid credentials')
        }
      })
      .catch((err) => {
        setError(err.message || 'Login failed')
      })
      .finally(() => setLoading(false))
  }

  return (
    <section className="admin-login-section">
      <h2>Admin login</h2>
      <p className="admin-login-desc">
        Enter the admin username and password.
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
    </section>
  )
}
