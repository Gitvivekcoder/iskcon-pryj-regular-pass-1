import { QRCodeSVG } from 'qrcode.react'

/**
 * Pass layout: heading "ISKCON PRAYAGRAJ REGULAR PASS", Name, Gender, Photo, QR.
 * showPassId: false = user view (View my pass); true = admin view (after register). Default true.
 */
export default function PassDisplay({ pass: p, onPrint, showPassId = true }) {
  if (!p || !p.passId) return null

  return (
    <div className="pass-display">
      <h2 className="pass-heading">ISKCON PRAYAGRAJ REGULAR PASS</h2>
      <div className="pass-body">
        {p.photo && (
          <div className="pass-photo-wrap">
            <img src={p.photo} alt="" className="pass-photo" />
          </div>
        )}
        <div className="pass-details">
          <p><strong>Name:</strong> {p.name || '—'}</p>
          <p><strong>Gender:</strong> {p.gender || '—'}</p>
          {showPassId && <p><strong>Pass ID:</strong> {p.passId}</p>}
        </div>
        <div className="pass-qr">
          <QRCodeSVG value={p.passId} size={120} level="M" />
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
