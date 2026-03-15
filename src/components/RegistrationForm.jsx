import { useState, useRef, useEffect } from 'react'
import { postToSheet } from '../lib/api.js'
import PassDisplay from './PassDisplay.jsx'

/** Convert YYYY-MM-DD (from input type="date") to DD/MM/YYYY for API/sheet. */
function dateToDdMmYyyy(value) {
  if (!value || !value.trim()) return ''
  const [y, m, d] = value.trim().split('-')
  return [d, m, y].join('/')
}

export default function RegistrationForm({ category = 'FOJ' }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [photo, setPhoto] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [familyMember1, setFamilyMember1] = useState('')
  const [familyMember2, setFamilyMember2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredPass, setRegisteredPass] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  /** 'user' = front, 'environment' = rear (for mobile camera switch) */
  const [cameraFacing, setCameraFacing] = useState('user')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  async function startCamera(facing = cameraFacing) {
    setError('')
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraFacing(facing)
      setCameraReady(true)
    } catch (err) {
      setError('Camera access denied or not available.')
    }
  }

  function switchCamera() {
    const next = cameraFacing === 'user' ? 'environment' : 'user'
    stopCamera()
    startCamera(next)
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
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
      dob: dateToDdMmYyyy(dob),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      category: category,
      ...(category === 'FOLK' && {
        familyMember1: familyMember1.trim(),
        familyMember2: familyMember2.trim(),
      }),
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
        setAddress('')
        setFamilyMember1('')
        setFamilyMember2('')
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
        <PassDisplay pass={registeredPass} />
        <button type="button" className="back-btn" onClick={registerAnother}>
          Register another person
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h3>Register {category}</h3>
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
              {!cameraReady ? (
                <>
                  <p className="camera-option-hint">On mobile, choose camera:</p>
                  <div className="camera-switch-btns">
                    <button
                      type="button"
                      className={cameraFacing === 'user' ? 'secondary-btn active' : 'secondary-btn'}
                      onClick={() => setCameraFacing('user')}
                    >
                      Front camera
                    </button>
                    <button
                      type="button"
                      className={cameraFacing === 'environment' ? 'secondary-btn active' : 'secondary-btn'}
                      onClick={() => setCameraFacing('environment')}
                    >
                      Rear camera
                    </button>
                  </div>
                  <button type="button" className="secondary-btn" onClick={() => startCamera()}>
                    Start camera
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="secondary-btn" onClick={capturePhoto}>
                    Capture photo
                  </button>
                  <button type="button" className="secondary-btn" onClick={switchCamera}>
                    Switch to {cameraFacing === 'user' ? 'rear' : 'front'} camera
                  </button>
                  <button type="button" className="secondary-btn" onClick={stopCamera}>
                    Stop camera
                  </button>
                </>
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
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
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
      <label className="field">
        <span>Address</span>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
      </label>
      {category === 'FOLK' && (
        <>
          <label className="field">
            <span>Family Member 1</span>
            <input type="text" value={familyMember1} onChange={(e) => setFamilyMember1(e.target.value)} placeholder="Name (optional)" />
          </label>
          <label className="field">
            <span>Family Member 2</span>
            <input type="text" value={familyMember2} onChange={(e) => setFamilyMember2(e.target.value)} placeholder="Name (optional)" />
          </label>
        </>
      )}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="submit-btn" disabled={loading || !photo}>
        {loading ? 'Registering…' : 'Register'}
      </button>
    </form>
  )
}
