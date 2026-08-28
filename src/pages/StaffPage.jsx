import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSchoolTeachers,
  addSchoolTeacher,
  setTeacherActive,
  deleteSchoolTeacher,
} from '../utils/api.js';

const ROLE_LABELS = { teacher: 'Teacher', bursar: 'Bursar', head: 'Head' };

export default function StaffPage() {
  const navigate = useNavigate();
  const schoolId = sessionStorage.getItem('school_id');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  async function load() {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSchoolTeachers(schoolId);
      setTeachers(data.teachers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load staff. Check your session.');
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [schoolId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setError('');
    try {
      await addSchoolTeacher(schoolId, { ...form, phone: form.phone.trim(), full_name: form.full_name.trim(), email: form.email.trim() || null });
      setShowAdd(false);
      setForm({ full_name: '', phone: '', email: '', role: 'teacher' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add staff member.');
    }
    setSaving(false);
  }

  async function handleToggle(t) {
    setBusyId(t.teacher_id);
    setError('');
    try {
      await setTeacherActive(schoolId, t.teacher_id, t.active === 0);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update staff member.');
    }
    setBusyId('');
  }

  async function handleDelete(t) {
    if (!window.confirm(`Remove ${t.full_name} from this school? This cannot be undone.`)) return;
    setBusyId(t.teacher_id);
    setError('');
    try {
      await deleteSchoolTeacher(schoolId, t.teacher_id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove staff member.');
    }
    setBusyId('');
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Staff</h1>
          <button onClick={() => setShowAdd(v => !v)} className="btn-ghost text-sm" style={{ color: '#7B4F9B' }}>
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <p className="text-sm" style={{ color: '#888' }}>
          Manage teachers and bursars. Deactivate a staff member when they leave the school — they will no longer be able to log in.
        </p>

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} className="card p-4 space-y-3">
            <h2 className="text-sm font-bold" style={{ color: '#7B4F9B' }}>Add Staff</h2>
            <input className="input-field" placeholder="Full name *" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            <input className="input-field" placeholder="Phone e.g. 254712345678 *" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} required />
            <input className="input-field" placeholder="Email (optional)" value={form.email} type="email"
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <div className="flex gap-2">
              {['teacher', 'bursar'].map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    border: form.role === r ? '2px solid #7B4F9B' : '2px solid #ddd',
                    backgroundColor: form.role === r ? '#F3E7FA' : '#fff',
                    color: form.role === r ? '#7B4F9B' : '#888',
                  }}>{ROLE_LABELS[r]}</button>
              ))}
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Add Staff Member'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-center" style={{ color: '#999' }}>Loading staff...</p>
        ) : teachers.length === 0 ? (
          <div className="card p-5 text-center text-sm" style={{ color: '#888' }}>
            No staff members yet. Tap + Add to create one.
          </div>
        ) : (
          teachers.map(t => (
            <div key={t.teacher_id} className="card p-4 flex items-center justify-between" style={{ opacity: t.active === 0 ? 0.6 : 1 }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{t.full_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.role === 'head' ? '#FFF3E0' : '#F3E7FA', color: t.role === 'head' ? '#E65100' : '#7B4F9B' }}>
                    {ROLE_LABELS[t.role] || t.role}
                  </span>
                  {t.active === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Inactive</span>
                  )}
                </div>
                <div className="text-xs mt-1" style={{ color: '#888' }}>{t.phone}{t.email ? ` · ${t.email}` : ''}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {t.role !== 'head' && (
                  <>
                    <button onClick={() => handleToggle(t)} disabled={busyId === t.teacher_id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{
                        border: 'none', cursor: 'pointer',
                        backgroundColor: t.active === 0 ? '#E8F5E9' : '#FFEBEE',
                        color: t.active === 0 ? '#2E7D32' : '#C62828',
                      }}>
                      {t.active === 0 ? 'Activate' : 'Deactivate'}
                    </button>
                    <button onClick={() => handleDelete(t)} disabled={busyId === t.teacher_id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ border: 'none', cursor: 'pointer', backgroundColor: '#EEEEEE', color: '#666' }}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
