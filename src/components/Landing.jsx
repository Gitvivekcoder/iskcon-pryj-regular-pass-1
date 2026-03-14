import { useState } from 'react'
import ViewMyPass from './ViewMyPass.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminArea from './AdminArea.jsx'

export default function Landing() {
  const [showViewPass, setShowViewPass] = useState(true)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)

  function handleAdminSuccess() {
    setAdminLoggedIn(true)
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <h1>ISKCON Prayagraj</h1>
        <p className="tagline">Regular Pass</p>
        {!adminLoggedIn && (
          <a href="#admin" className="admin-link" onClick={(e) => { e.preventDefault(); setShowViewPass(false); }}>
            Admin login
          </a>
        )}
      </header>

      <main className="landing-main">
        {adminLoggedIn ? (
          <AdminArea onLogout={() => setAdminLoggedIn(false)} />
        ) : showViewPass ? (
          <ViewMyPass />
        ) : (
          <>
            <AdminLogin onSuccess={handleAdminSuccess} />
            <button type="button" className="back-btn" onClick={() => setShowViewPass(true)}>
              ← Back to View my pass
            </button>
          </>
        )}
      </main>
    </div>
  )
}
