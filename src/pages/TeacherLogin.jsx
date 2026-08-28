import React, { useState } from 'react';
import OTPInput from '../components/OTPInput.jsx';
import { requestTeacherOtp, verifyTeacherOtp } from '../utils/api.js';

export default function TeacherLogin() {
  const [step, setStep] = useState('identifier');
  const [method, setMethod] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  async function handleRequestOtp(e) {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    try {
      const body = method === 'email' ? { email: value } : { phone: value };
      const data = await requestTeacherOtp(body);
      setSessionId(data.session_id);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
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
      setError(err.response?.data?.error || 'Invalid code');
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
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#7B4F9B' }}>
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Education APP</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Powered by Smarternow Data Venture</p>
        </div>
        <div className="mb-5 px-1 space-y-3 text-center">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Free digital tools for Kenyan teachers. Track attendance, record CBC assessments, and generate report cards — offline first.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <span style={{ color: '#81C784' }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>Offline attendance</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <span style={{ color: '#81C784' }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>CBC assessments</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <span style={{ color: '#81C784' }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>Report cards</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <span style={{ color: '#81C784' }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>Free for schools</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card p-6 shadow-xl">
          {step === 'identifier' && (
            <form onSubmit={handleRequestOtp}>
              <div className="flex gap-2 mb-4">
                {(['phone', 'email']).map(m => (
                  <button key={m} type="button" onClick={() => { setMethod(m); setIdentifier(''); }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold"
                    style={{
                      border: method === m ? '2px solid #7B4F9B' : '2px solid #ddd',
                      backgroundColor: method === m ? '#F3E7FA' : '#fff',
                      color: method === m ? '#7B4F9B' : '#888',
                    }}>
                    {m === 'phone' ? '📱 Phone' : '✉️ Email'}
                  </button>
                ))}
              </div>
              {method === 'phone' ? (
                <>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Phone Number</label>
                  <input type="tel" placeholder="e.g. 254712345678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="input-field mb-4" autoFocus required />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Email Address</label>
                  <input type="email" placeholder="teacher@school.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="input-field mb-4" autoFocus required />
                </>
              )}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Sending...' : 'Continue with OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <p className="text-sm mb-1 text-center" style={{ color: '#666' }}>
                Enter the code sent to your {method === 'email' ? 'email' : 'phone'}
              </p>
              <p className="text-base font-semibold mb-5 text-center" style={{ color: '#7B4F9B' }}>{identifier}</p>
              <OTPInput onComplete={handleVerify} />
              <button onClick={() => { setStep('identifier'); setError(''); }} className="w-full mt-3 text-center text-sm" style={{ color: '#888' }}>← Change {method === 'email' ? 'email' : 'number'}</button>
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
