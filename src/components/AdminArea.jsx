import { useState } from 'react'
import RegistrationForm from './RegistrationForm.jsx'
import VerifyPass from './VerifyPass.jsx'
import VerifyPassByQR from './VerifyPassByQR.jsx'

export default function AdminArea({ onLogout }) {
  const [tab, setTab] = useState('register') // 'register' | 'verify' | 'verify-qr'

  return (
    <section className="admin-area">
      <div className="admin-area-header">
        <h2>Admin area</h2>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      </div>
      <nav className="admin-tabs">
        <button
          type="button"
          className={tab === 'register' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('register')}
        >
          Register person
        </button>
        <button
          type="button"
          className={tab === 'verify' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('verify')}
        >
          Verify pass
        </button>
        <button
          type="button"
          className={tab === 'verify-qr' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('verify-qr')}
        >
          Verify pass using QR
        </button>
      </nav>
      {tab === 'register' && <RegistrationForm />}
      {tab === 'verify' && <VerifyPass />}
      {tab === 'verify-qr' && <VerifyPassByQR />}
    </section>
  )
}
