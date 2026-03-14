import { useState, useRef, useEffect } from 'react'
import { postToSheet } from '../lib/api.js'
import PassDisplay from './PassDisplay.jsx'

function normalizeDobInput(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

export default function RegistrationForm() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [photo, setPhoto] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredPass, setRegisteredPass] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setError('Camera access denied or not available.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function capturePhoto() {
    if (!videoRef.current || !streamRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhoto(dataUrl)
    stopCamera()
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setRegisteredPass(null)
    setLoading(true)
    postToSheet({
      action: 'register',
      name: name.trim(),
      gender: gender.trim(),
      photo,
      dob: dob.trim(),
      phone: phone.trim(),
      email: email.trim(),
    })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setRegisteredPass(data)
        setName('')
        setGender('')
        setPhoto('')
        setDob('')
        setPhone('')
        setEmail('')
      })
      .catch((err) => setError(err.message || 'Registration failed'))
      .finally(() => setLoading(false))
  }

  function registerAnother() {
    setRegisteredPass(null)
  }

  if (registeredPass) {
    return (
      <div className="registration-result">
        <p className="success-msg">Pass registered successfully.</p>
        <PassDisplay pass={registeredPass} onPrint={() => window.print()} />
        <button type="button" className="back-btn" onClick={registerAnother}>
          Register another person
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h3>Register a person</h3>
      <label className="field">
        <span>Name *</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="field">
        <span>Gender</span>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </label>
      <div className="field">
        <span>Photo (on the spot) *</span>
        {!photo ? (
          <div className="photo-capture">
            <video ref={videoRef} autoPlay playsInline muted className="capture-video" />
            <div className="capture-actions">
              <button type="button" className="secondary-btn" onClick={startCamera}>
                Start camera
              </button>
              <button type="button" className="secondary-btn" onClick={capturePhoto} disabled={!streamRef.current}>
                Capture photo
              </button>
              {streamRef.current && (
                <button type="button" className="secondary-btn" onClick={stopCamera}>
                  Stop camera
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="photo-preview">
            <img src={photo} alt="Captured" />
            <button type="button" className="secondary-btn" onClick={() => setPhoto('')}>
              Retake photo
            </button>
          </div>
        )}
      </div>
      <label className="field">
        <span>Date of birth *</span>
        <input
          type="text"
          placeholder="DD/MM/YYYY"
          value={dob}
          onChange={(e) => setDob(normalizeDobInput(e.target.value))}
          maxLength={10}
          required
        />
      </label>
      <label className="field">
        <span>Mobile number *</span>
        <input
          type="tel"
          placeholder="10-digit"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          required
        />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="submit-btn" disabled={loading || !photo}>
        {loading ? 'Registering…' : 'Register'}
      </button>
    </form>
  )
}
