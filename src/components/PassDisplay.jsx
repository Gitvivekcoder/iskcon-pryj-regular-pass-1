import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { QRCodeSVG } from 'qrcode.react'

const PASS_CONFIG = {
  FOJ: { heading: 'FOJ ID', tagline: 'Friends of Jagannath' },
  FOLK: { heading: 'FOLK ID', tagline: 'Family of Lord Krishna' },
}

/**
 * Pass layout: heading by category (FOJ ID / FOLK ID), tagline, Name, Gender, Photo, QR.
 * FOLK pass also shows family member names.
 * showPassId: default true. showHindi: when true (e.g. View my pass), show Hindi alongside English.
 */
export default function PassDisplay({ pass: p, showPassId = true, showHindi = false }) {
  const passContentRef = useRef(null)

  if (!p || !p.passId) return null

  const category = (p.category || 'FOJ').toUpperCase()
  const config = PASS_CONFIG[category] || PASS_CONFIG.FOJ

  const familyMembers = [p.familyMember1, p.familyMember2].filter(Boolean)
  const isFOLK = category === 'FOLK'

  async function handleDownload() {
    if (!passContentRef.current) return
    try {
      const canvas = await html2canvas(passContentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#fefcf8',
      })
      const link = document.createElement('a')
      link.download = `pass-${p.passId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="pass-display">
      <div ref={passContentRef} className="pass-display-content">
        <header className="pass-header">
          <img src="/iskpryj.png" alt="ISKCON Prayagraj" className="pass-logo" />
          <div className="pass-header-right">
            <h2 className="pass-heading">{config.heading}</h2>
            <p className="pass-tagline">{config.tagline}</p>
          </div>
        </header>
        <div className="pass-body">
          <div className="pass-body-left">
            {p.photo && (
              <div className="pass-photo-wrap">
                <img src={p.photo} alt="" className="pass-photo" />
              </div>
            )}
            <div className="pass-qr-wrap">
              <QRCodeSVG value={p.passId} size={80} level="M" className="pass-qr" />
            </div>
          </div>
          <div className="pass-body-right">
            <div className="pass-details">
              <p><strong>Name{showHindi && ' / नाम'}:</strong> {p.name || '—'}</p>
              <p><strong>Gender{showHindi && ' / लिंग'}:</strong> {p.gender || '—'}</p>
              {isFOLK && familyMembers.length > 0 && (
                <p><strong>Family members{showHindi && ' / परिवार के सदस्य'}:</strong> {familyMembers.join(', ')}</p>
              )}
              {showPassId && <p><strong>Pass ID{showHindi && ' / पास आईडी'}:</strong> {p.passId}</p>}
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="download-btn" onClick={handleDownload}>
        Download pass{showHindi && ' / पास डाउनलोड करें'}
      </button>
    </div>
  )
}
