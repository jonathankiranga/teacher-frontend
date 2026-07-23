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

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold" style={{ color: '#333' }}>Attendance</h1>
            <p className="text-xs" style={{ color: '#999' }}>{date}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
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
        <StudentList teacherId={teacherId} date={date} />
      </div>
    </div>
  );
}
