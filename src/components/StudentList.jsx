import React, { useEffect, useState, useCallback } from 'react';
import StudentCard from './StudentCard.jsx';
import { getRoster, saveRoster, getAttendanceByDate } from '../utils/indexedDB.js';
import { fetchStudents } from '../utils/api.js';
import { downloadCSV } from '../utils/csvExport.js';

export default function StudentList({ teacherId, date }) {
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let roster = await getRoster(teacherId);
      if (roster.length === 0 && navigator.onLine) {
        const data = await fetchStudents(teacherId);
        roster = data.students || data;
        if (roster.length) await saveRoster(roster);
      }
      const existing = await getAttendanceByDate(date, teacherId);
      const map = {};
      existing.forEach(r => { map[r.student_id] = r.status; });
      setStatusMap(map);
      setStudents(roster);
    } catch (e) {
      setError('Failed to load students');
    }
    setLoading(false);
  }, [teacherId, date]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  useEffect(() => {
    getAttendanceByDate(date, teacherId).then(existing => {
      const map = {};
      existing.forEach(r => { map[r.student_id] = r.status; });
      setStatusMap(map);
    });
  }, [date, teacherId]);

  function handleStatusChange(studentId, status) {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  }

  function handleExport() {
    const rows = students.map(s => ({
      student_id: s.student_id,
      date,
      status: statusMap[s.student_id] || '',
      teacher_id: teacherId
    }));
    downloadCSV(rows, `attendance-${date}.csv`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm" style={{ color: '#C62828' }}>{error}</p>
        <button onClick={loadRoster} className="mt-3 btn-secondary">Retry</button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm" style={{ color: '#999' }}>No students found. Sync the roster first.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: '#666' }}>{students.length} students</p>
        <button onClick={handleExport} className="btn-secondary text-xs">Export CSV</button>
      </div>
      <div className="space-y-2">
        {students.map(s => (
          <StudentCard
            key={s.student_id}
            student={s}
            date={date}
            teacherId={teacherId}
            initialStatus={statusMap[s.student_id] || null}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
