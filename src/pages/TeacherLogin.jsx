import React, { useState } from 'react';
import OTPInput from '../components/OTPInput.jsx';
import { requestTeacherOtp, verifyTeacherOtp, waitForServer } from '../utils/api.js';

export default function TeacherLogin() {
  const [step, setStep] = useState('credential');
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  async function handleRequestOtp(e) {
    e.preventDefault();
    const value = credential.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    try {
      // Wait for Render to wake up before sending the OTP request
      const ready = await waitForServer({ onWaiting: () => setWaking(true) });
      setWaking(false);
      if (!ready) {
        setError('Server is taking too long to respond. Please try again.');
        setLoading(false);
        return;
      }
      const isEmail = value.includes('@');
      const data = await requestTeacherOtp(
        isEmail ? undefined : value,
        isEmail ? value : undefined
      );
      setSessionId(data.session_id);
      setStep('otp');
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
        (err.response?.status === 404 ? 'Teacher not found. Check your phone or email.' :
         err.response?.status === 400 ? 'Invalid format. Try 254712345678 or your email.' :
         err.message || 'Failed to send OTP. Try again.');
      setError(errorMsg);
    }
    setLoading(false);
  }

  async function handleVerify(code) {
    setLoading(true);
    setError('');
    try {
      const data = await verifyTeacherOtp(sessionId, code);
      sessionStorage.setItem('teacher_id', data.teacher_id);
      sessionStorage.setItem('school_id', data.school_id);
      sessionStorage.setItem('role', data.role || 'teacher');
      sessionStorage.setItem('session_id', data.session_id || '');
      window.location.hash = '#/home';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px'
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#7B4F9B' }}>
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Education APP</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Powered by Smarternow Data Venture</p>
        </div>

        {/* Feature highlights */}
        <div className="mb-5 px-1 space-y-3 text-center">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Free digital tools for Kenyan teachers. Track attendance, record CBC assessments, and generate report cards — offline first.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Offline attendance', 'CBC assessments', 'Report cards', 'Free for schools'].map(f => (
              <div key={f} className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <span style={{ color: '#81C784' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-card p-6 shadow-xl">
          {step === 'credential' && (
            <form onSubmit={handleRequestOtp}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>
                Phone or Email
              </label>
              <input
                type="text"
                placeholder="254712345678 or you@email.com"
                value={credential}
                onChange={e => setCredential(e.target.value)}
                className="input-field mb-4"
                autoFocus
                autoComplete="email tel"
                required
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {waking ? 'Please wait…' : loading ? 'Sending OTP...' : 'Continue'}
              </button>
              <p className="text-xs text-center mt-3" style={{ color: '#aaa' }}>
                Your school is linked to your account automatically
              </p>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <p className="text-sm mb-1 text-center" style={{ color: '#666' }}>
                Enter the code sent to
              </p>
              <p className="text-base font-semibold mb-5 text-center" style={{ color: '#7B4F9B' }}>
                {credential}
              </p>
              <OTPInput onComplete={handleVerify} />
              <button
                onClick={() => { setStep('credential'); setError(''); }}
                className="w-full mt-3 text-center text-sm"
                style={{ color: '#888' }}
              >
                ← Use a different phone or email
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
