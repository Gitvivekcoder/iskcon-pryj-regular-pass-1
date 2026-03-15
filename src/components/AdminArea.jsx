import { useState } from 'react'
import RegistrationForm from './RegistrationForm.jsx'
import VerifyPass from './VerifyPass.jsx'
import VerifyPassByQR from './VerifyPassByQR.jsx'

export default function AdminArea({ onLogout }) {
  const [tab, setTab] = useState('register-foj') // 'register-foj' | 'register-folk' | 'verify' | 'verify-qr'

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
          className={tab === 'register-foj' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('register-foj')}
        >
          Register FOJ
        </button>
        <button
          type="button"
          className={tab === 'register-folk' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('register-folk')}
        >
          Register FOLK
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
      {tab === 'register-foj' && <RegistrationForm category="FOJ" />}
      {tab === 'register-folk' && <RegistrationForm category="FOLK" />}
      {tab === 'verify' && <VerifyPass />}
      {tab === 'verify-qr' && <VerifyPassByQR />}
    </section>
  )
}
