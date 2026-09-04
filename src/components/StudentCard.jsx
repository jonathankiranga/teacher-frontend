import React, { useState, useRef, useEffect } from 'react';
import { saveAttendance } from '../utils/indexedDB.js';

export default function StudentCard({ student, date, teacherId, initialStatus, onStatusChange }) {
  const [status, setStatus] = useState(initialStatus || null);
  const timeoutRef = useRef(null);
  // Track the pending save payload so we can flush it on unmount
  const pendingRef = useRef(null);

  // Flush any pending save when the component unmounts (e.g. app closed,
  // page navigated away, or list re-rendered before the 300ms debounce fires).
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Fire the save synchronously on cleanup if there's a pending write
        if (pendingRef.current) {
          const { date: d, record } = pendingRef.current;
          saveAttendance(d, [record]).catch(() => {});
          pendingRef.current = null;
        }
      }
    };
  }, []);

  function handleTap(value) {
    const newStatus = status === value ? null : value;
    setStatus(newStatus);

    const schoolId = sessionStorage.getItem('school_id') || '';
    const record = { student_id: student.student_id, status: newStatus || 'Absent', teacher_id: teacherId, school_id: schoolId };

    // Store the latest pending write so unmount cleanup can flush it
    pendingRef.current = { date, record };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      pendingRef.current = null; // cleared — save is now in flight
      await saveAttendance(date, [record]);
      if (onStatusChange) onStatusChange(student.student_id, newStatus || 'Absent');
    }, 300);
  }

  return (
    <div className="card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: '#7B4F9B' }}
        >
          {student.full_name ? student.full_name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: '#333' }}>{student.full_name}</p>
          {student.admission_number && (
            <p className="text-xs" style={{ color: '#aaa' }}>{student.admission_number}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => handleTap('Present')}
          className="w-11 h-11 rounded-lg text-lg font-bold transition-all duration-150 flex items-center justify-center"
          style={{
            backgroundColor: status === 'Present' ? '#2E7D32' : '#fff',
            color: status === 'Present' ? '#FFFFFF' : '#2E7D32',
            border: status === 'Present' ? '2px solid #2E7D32' : '2px solid #A5D6A7',
            boxShadow: status === 'Present' ? '0 2px 8px rgba(46,125,50,0.3)' : 'none',
          }}
        >
          ✓
        </button>
        <button
          onClick={() => handleTap('Absent')}
          className="w-11 h-11 rounded-lg text-lg font-bold transition-all duration-150 flex items-center justify-center"
          style={{
            backgroundColor: status === 'Absent' ? '#C62828' : '#fff',
            color: status === 'Absent' ? '#FFFFFF' : '#C62828',
            border: status === 'Absent' ? '2px solid #C62828' : '2px solid #EF9A9A',
            boxShadow: status === 'Absent' ? '0 2px 8px rgba(198,40,40,0.3)' : 'none',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
