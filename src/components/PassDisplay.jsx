import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const DEITY_IMAGE_URL = import.meta.env.VITE_DEITY_IMAGE_URL || '/images/deity-veni-madhav.png'
// Put your deity image in public/images/ (deity-veni-madhav.png or .jpg), or set VITE_DEITY_IMAGE_URL in .env

/**
 * Pass layout: landscape 3:2, ISKCON Prayagraj branding, deity image, coloured background.
 * showPassId: false = user view (View my pass); true = admin view (after register). Default true.
 */
export default function PassDisplay({ pass: p, onPrint, showPassId = true }) {
  const [deityImageError, setDeityImageError] = useState(false)

  if (!p || !p.passId) return null

  return (
    <div className="pass-card">
      <div className="pass-card-inner">
        {/* Left: deity / devotional panel */}
        <div className="pass-deity-panel">
          {!deityImageError ? (
            <img
              src={DEITY_IMAGE_URL}
              alt="Sri Sri Radha Veni Madhav"
              className="pass-deity-img"
              onError={() => setDeityImageError(true)}
            />
          ) : (
            <div className="pass-deity-fallback">
              <span className="pass-deity-fallback-title">Sri Sri</span>
              <span className="pass-deity-fallback-name">Radha Veni Madhav</span>
              <span className="pass-deity-fallback-place">ISKCON Prayagraj</span>
            </div>
          )}
        </div>

        {/* Right: pass content */}
        <div className="pass-content">
          <header className="pass-header">
            <h2 className="pass-org-name">ISKCON Prayagraj</h2>
            <span className="pass-badge">Regular Pass</span>
          </header>
          <div className="pass-divider" aria-hidden="true" />
          <div className="pass-body-inner">
            <div className="pass-left-col">
              {p.photo && (
                <div className="pass-photo-wrap">
                  <img src={p.photo} alt="" className="pass-photo" />
                </div>
              )}
              <div className="pass-details">
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Name</span>
                  <span className="pass-detail-value">{p.name || '—'}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-detail-label">Gender</span>
                  <span className="pass-detail-value">{p.gender || '—'}</span>
                </div>
                {showPassId && (
                  <div className="pass-detail-row pass-id-row">
                    <span className="pass-detail-label">Pass ID</span>
                    <span className="pass-detail-value pass-id-value">{p.passId}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="pass-right-col">
              <div className="pass-qr-wrap">
                <QRCodeSVG value={p.passId} size={80} level="M" className="pass-qr" />
              </div>
            </div>
          </div>
          <footer className="pass-footer">Sri Sri Radha Veni Madhav Temple, Prayagraj</footer>
        </div>
      </div>

      {onPrint && (
        <button type="button" className="print-btn" onClick={onPrint}>
          Print / Save pass
        </button>
      )}
    </div>
  )
}
