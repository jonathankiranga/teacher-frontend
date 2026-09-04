import React, { useEffect, useState, useCallback } from 'react';
import StudentCard from './StudentCard.jsx';
import { getRoster, saveRoster, getAttendanceByDate } from '../utils/indexedDB.js';
import { fetchStudents, getSchoolClasses, waitForServer } from '../utils/api.js';
import { downloadCSV } from '../utils/csvExport.js';

export default function StudentList({ teacherId, schoolId, date }) {
  const [students, setStudents] = useState([]);
  // Default to first class if available, instead of 'all'
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waking, setWaking] = useState(false);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Always load from IDB first so offline data shows immediately
      let roster = await getRoster(teacherId);
      const existing = await getAttendanceByDate(date, teacherId);
      const map = {};
      existing.forEach(r => { map[r.student_id] = r.status; });
      setStatusMap(map);
      if (roster.length > 0) setStudents(roster);

      // Fetch a fresh roster from the server if online
      if (navigator.onLine) {
        const ready = await waitForServer({
          onWaiting: () => setWaking(true)
        });
        setWaking(false);
        if (ready) {
          const data = await fetchStudents(teacherId);
          roster = data.students || data;
          if (roster.length) {
            await saveRoster(roster);
            setStudents(roster);
          }
        }
      }
    } catch (e) {
      setError('Failed to load students');
    }
    setLoading(false);
  }, [teacherId, date]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  // Class dropdown for this school
  useEffect(() => {
    if (!schoolId) { setClasses([]); return; }
    getSchoolClasses(schoolId).then(list => {
      setClasses(list);
    }).catch(() => setClasses([]));
  }, [schoolId]);

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
    const rows = filteredStudents.map(s => ({
      student_id: s.student_id,
      date,
      status: statusMap[s.student_id] || '',
      teacher_id: teacherId
    }));
    downloadCSV(rows, `attendance-${date}.csv`);
  }

  const filteredStudents = classId
    ? students.filter(s => String(s.class_id) === String(classId))
    : students;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
        {waking && (
          <p className="text-xs text-center px-4" style={{ color: '#888' }}>
            Server is starting up, please wait…
          </p>
        )}
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

  const selectedClassName = classes.find(c => String(c.class_id) === String(classId))?.class_name || '';

  return (
    <div>
      <div className="card p-3 mb-3">
        <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field">
          <option value="">— Select class —</option>
          {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: '#444' }}>
          {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}
          {selectedClassName ? <span style={{ fontWeight: 400, color: '#888' }}> · {selectedClassName}</span> : ''}
        </p>
        <button onClick={handleExport} className="btn-secondary text-xs">Export CSV</button>
      </div>
      <div className="space-y-2">
        {filteredStudents.map(s => (
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
