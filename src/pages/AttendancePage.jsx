import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentList from '../components/StudentList.jsx';
import SyncIndicator from '../components/SyncIndicator.jsx';
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
      <div className="navbar px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold" style={{ color: '#333' }}>Attendance</h1>
            <p className="text-xs" style={{ color: '#999' }}>{date}</p>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <button onClick={handleCsvExport} className="btn-secondary text-xs px-2.5 py-1.5" title="Export CSV Safety Backup">CSV Backup</button>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="card p-4 mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: '#555' }}>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
        </div>
        <StudentList teacherId={teacherId} schoolId={schoolId} date={date} />
      </div>
    </div>
  );
}
