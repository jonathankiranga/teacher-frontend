import React, { useState, useRef } from 'react';
import { saveAttendance } from '../utils/indexedDB.js';

export default function StudentCard({ student, date, teacherId, initialStatus, onStatusChange }) {
  const [status, setStatus] = useState(initialStatus || null);
  const timeoutRef = useRef(null);

  function handleTap(value) {
    const newStatus = status === value ? null : value;
    setStatus(newStatus);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      await saveAttendance(date, [{ student_id: student.student_id, status: newStatus || 'Absent', teacher_id: teacherId }]);
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
            backgroundColor: status === 'Present' ? '#2E7D32' : '#F5F5F5',
            color: status === 'Present' ? '#FFFFFF' : '#999',
            boxShadow: status === 'Present' ? '0 2px 8px rgba(46,125,50,0.25)' : 'none'
          }}
        >
          ✓
        </button>
        <button
          onClick={() => handleTap('Absent')}
          className="w-11 h-11 rounded-lg text-lg font-bold transition-all duration-150 flex items-center justify-center"
          style={{
            backgroundColor: status === 'Absent' ? '#C62828' : '#F5F5F5',
            color: status === 'Absent' ? '#FFFFFF' : '#999',
            boxShadow: status === 'Absent' ? '0 2px 8px rgba(198,40,40,0.25)' : 'none'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
