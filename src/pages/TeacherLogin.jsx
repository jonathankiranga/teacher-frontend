import React, { useState, useRef, useEffect } from 'react';
import OTPInput from '../components/OTPInput.jsx';
import { requestTeacherOtp, verifyTeacherOtp, searchSchools } from '../utils/api.js';

export default function TeacherLogin() {
  const [step, setStep] = useState('school');
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const schoolRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (schoolQuery.length < 2) { setSchoolResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchSchools(schoolQuery);
        setSchoolResults(data.schools || []);
      } catch { setSchoolResults([]); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [schoolQuery]);

  useEffect(() => {
    function handleClick(e) {
      if (schoolRef.current && !schoolRef.current.contains(e.target)) setSchoolResults([]);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await requestTeacherOtp(phone);
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
      window.location.hash = '#/home';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  }

  function selectSchool(school) {
    setSelectedSchool(school);
    setSchoolQuery(school.school_name);
    setSchoolResults([]);
    setStep('phone');
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#7B4F9B' }}>
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Education APP</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Powered by Smarternow Data Venture</p>
        </div>

        <div className="bg-white rounded-card p-6 shadow-xl">
          {step === 'school' && (
            <div ref={schoolRef}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Search your school</label>
              <input
                type="text"
                placeholder="Type school name..."
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                className="input-field"
                autoFocus
              />
              {schoolResults.length > 0 && (
                <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid #E8E8E8', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {schoolResults.map(s => (
                    <button key={s.school_id} onClick={() => selectSchool(s)}
                      className="w-full px-4 py-3 text-left text-sm transition-colors"
                      style={{ borderBottom: '1px solid #F0F0F0' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F8F8'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <span style={{ color: '#333' }}>{s.school_name}</span>
                      {s.region && <span className="text-xs ml-2" style={{ color: '#aaa' }}>{s.region}</span>}
                    </button>
                  ))}
                </div>
              )}
              {schoolQuery.length >= 2 && schoolResults.length === 0 && (
                <p className="text-xs mt-2" style={{ color: '#888' }}>No schools found</p>
              )}
            </div>
          )}

          {step === 'phone' && selectedSchool && (
            <form onSubmit={handleRequestOtp}>
              <p className="text-xs mb-3" style={{ color: '#888' }}>
                School: <span className="font-semibold" style={{ color: '#7B4F9B' }}>{selectedSchool.school_name}</span>
                <button type="button" onClick={() => { setStep('school'); setSelectedSchool(null); setSchoolQuery(''); }} className="ml-2 text-xs" style={{ color: '#aaa' }}>Change</button>
              </p>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Phone Number</label>
              <input type="tel" placeholder="e.g. 254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field mb-4" required />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Sending...' : 'Continue with OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <p className="text-sm mb-1 text-center" style={{ color: '#666' }}>Enter the code sent to</p>
              <p className="text-base font-semibold mb-5 text-center" style={{ color: '#7B4F9B' }}>{phone}</p>
              <OTPInput onComplete={handleVerify} />
              <button onClick={() => { setStep('phone'); setError(''); }} className="w-full mt-3 text-center text-sm" style={{ color: '#888' }}>← Change number</button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="#/parent" className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Parent Portal →</a>
        </div>

      </div>
    </div>
  );
}
