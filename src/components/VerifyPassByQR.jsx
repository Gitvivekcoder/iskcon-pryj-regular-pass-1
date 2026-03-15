import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { getPassById } from '../lib/api.js'

const QR_READER_ID = 'qr-reader-verify-by-qr'

/** Admin-only: scan QR with camera → extract Pass ID → getPassById → display pass details */
export default function VerifyPassByQR() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  /** 'environment' = rear, 'user' = front (for mobile camera switch) */
  const [facingMode, setFacingMode] = useState('environment')
  const scannerRef = useRef(null)

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        scannerRef.current = null
        setScanning(false)
      })
    }
  }

  function onScanSuccess(decodedText) {
    const passId = decodedText.trim()
    if (!passId) return
    stopScanner()
    setError('')
    setDetails(null)
    setLoading(true)
    getPassById(passId)
      .then((data) => {
        if (data && data.error) {
          setError('No pass found with this ID.')
          return
        }
        setDetails(data)
      })
      .catch((err) => setError(err.message || 'Request failed'))
      .finally(() => setLoading(false))
  }

  function startScanner(useFacing = facingMode) {
    if (scannerRef.current) return
    setError('')
    setDetails(null)
    const html5Qr = new Html5Qrcode(QR_READER_ID)
    scannerRef.current = html5Qr
    html5Qr.start(
      { facingMode: useFacing },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => onScanSuccess(decodedText),
      () => {}
    ).then(() => setScanning(true)).catch((err) => {
      setError(err.message || 'Camera access failed.')
      scannerRef.current = null
    })
  }

  function switchCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    stopScanner()
    setTimeout(() => startScanner(next), 300)
  }

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  function handleScanAgain() {
    stopScanner()
    setError('')
    setDetails(null)
    setTimeout(() => startScanner(), 300)
  }

  return (
    <section className="verify-pass-qr-section">
      <h3>Verify pass using QR</h3>
      <p>Point the camera at the pass QR code. The Pass ID will be read and used to fetch pass details.</p>

      <div id={QR_READER_ID} className="qr-reader-container" />

      {!scanning && !details && (
        <div className="camera-actions">
          <p className="camera-option-hint">On mobile, choose camera:</p>
          <div className="camera-switch-btns">
            <button
              type="button"
              className={facingMode === 'environment' ? 'secondary-btn active' : 'secondary-btn'}
              onClick={() => setFacingMode('environment')}
            >
              Rear camera
            </button>
            <button
              type="button"
              className={facingMode === 'user' ? 'secondary-btn active' : 'secondary-btn'}
              onClick={() => setFacingMode('user')}
            >
              Front camera
            </button>
          </div>
          <button type="button" className="submit-btn" onClick={() => startScanner()}>
            Start camera
          </button>
        </div>
      )}

      {scanning && !details && (
        <div className="camera-actions">
          <button type="button" className="secondary-btn" onClick={switchCamera}>
            Switch to {facingMode === 'environment' ? 'front' : 'rear'} camera
          </button>
          <button type="button" className="secondary-btn" onClick={stopScanner}>
            Stop camera
          </button>
        </div>
      )}

      {loading && <p className="verify-loading">Looking up pass…</p>}
      {error && <p className="form-error">{error}</p>}

      {details && (
        <>
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
          <button type="button" className="secondary-btn" onClick={handleScanAgain}>
            Scan another QR
          </button>
        </>
      )}
    </section>
  )
}
