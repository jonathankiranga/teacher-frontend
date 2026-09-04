import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentList from '../components/StudentList.jsx';
import SyncIndicator from '../components/SyncIndicator.jsx';
import InstallPrompt from '../components/InstallPrompt.jsx';
import { startSync, stopSync } from '../utils/syncManager.js';

export default function AttendancePage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    startSync();
    return () => stopSync();
  }, []);

  if (!teacherId) return null;

  function handleLogout() {
    sessionStorage.clear();
    navigate('/teacher/login', { replace: true });
  }

  async function handleCsvExport() {
    try {
      const { getAttendanceByDate } = await import('../utils/indexedDB.js');
      const { downloadCSV } = await import('../utils/csvExport.js');
      const logs = await getAttendanceByDate(date, teacherId);
      if (!logs || logs.length === 0) {
        alert(`No saved attendance records found for ${date}`);
        return;
      }
      downloadCSV(logs, `attendance_${date}.csv`);
    } catch (e) {
      alert('Failed to export CSV: ' + e.message);
    }
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      {/* Compact navbar — title left, controls right */}
      <div className="navbar px-3 py-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Page title */}
          <div style={{ flex: '0 0 auto' }}>
            <h1 className="text-base font-bold" style={{ color: '#333', lineHeight: 1.2 }}>Attendance</h1>
            <p className="text-xs" style={{ color: '#999', lineHeight: 1 }}>{date}</p>
          </div>

          {/* Date picker grows to fill space */}
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              flex: '1 1 120px',
              padding: '7px 10px',
              borderRadius: 8,
              border: '1.5px solid #E0E0E0',
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none',
              minWidth: 0,
            }}
          />

          <SyncIndicator />
          <InstallPrompt />
          <button
            onClick={handleCsvExport}
            title="Export CSV backup"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              border: '1.5px solid #E0E0E0', backgroundColor: '#FAFAFA',
              cursor: 'pointer', flexShrink: 0,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '7px 12px', borderRadius: 8,
              border: '1.5px solid #E0E0E0', backgroundColor: '#FAFAFA',
              fontSize: 12, fontWeight: 600, color: '#666',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-3 pt-3">
        <StudentList teacherId={teacherId} schoolId={schoolId} date={date} />
      </div>
    </div>
  );
}
