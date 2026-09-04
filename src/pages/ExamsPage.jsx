import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchStudents, getSchoolClasses } from '../utils/api.js';
import { getLearningAreas, getExamSessions, getLearningAreasWithSubAreas, getExamSessionResults, saveExamResults } from '../utils/api.js';
import { saveExamResultsOffline } from '../utils/indexedDB.js';

export default function ExamsPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [premiumBlocked, setPremiumBlocked] = useState(false);

  // Check if premium payment blocks exam posting
  useEffect(() => {
    if (!schoolId) return;
    api.get('/api/exam-sessions/premium-status', { params: { school_id: schoolId } })
      .then(r => setPremiumBlocked(r.data.blocked || false))
      .catch(() => {});
  }, [schoolId]);

  const isClosed = session?.status === 'Closed';

  useEffect(() => {
    if (!teacherId) { navigate('/teacher/login', { replace: true }); return; }
    fetchStudents(teacherId).then(data => {
      setStudents(data.students || []);
    }).catch(() => {});
  }, [teacherId, navigate]);

  // Class dropdown for this school
  useEffect(() => {
    if (!schoolId) return;
    getSchoolClasses(schoolId).then(list => {
      setClasses(list.map(c => ({ value: c.class_id, label: c.class_name })));
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !classId) { setSessions([]); return; }
    getExamSessions({ school_id: schoolId, class_id: classId, term, year })
      .then(d => setSessions(d.sessions || []))
      .catch(() => {});
  }, [schoolId, classId, term, year]);

  useEffect(() => {
    if (!schoolId) return;
    getLearningAreasWithSubAreas(schoolId).then(d => {
      const subAreas = d.sub_areas || [];
      const areaMap = {};
      subAreas.forEach(sa => {
        if (!areaMap[sa.area_id]) {
          areaMap[sa.area_id] = { area_id: sa.area_id, area_name: sa.area_name, sub_areas: [] };
        }
        areaMap[sa.area_id].sub_areas.push({
          sub_area_id: sa.sub_area_id, sub_area_name: sa.sub_area_name, display_order: sa.display_order
        });
      });
      setAreas(Object.values(areaMap).sort((a, b) => a.area_name?.localeCompare(b.area_name)));
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (!sessionId) { setResults({}); setSession(null); return; }
    const s = sessions.find(x => x.session_id === parseInt(sessionId));
    setSession(s || null);
    getExamSessionResults(sessionId).then(d => {
      const map = {};
      (d.results || []).forEach(r => {
        if (!map[r.student_id]) map[r.student_id] = {};
        map[r.student_id][r.sub_area_id] = { score: r.score, out_of: r.out_of, level: r.performance_level };
      });
      setResults(map);
    }).catch(() => {});
  }, [sessionId, sessions]);

  const updateScore = useCallback((studentId, subAreaId, field, value) => {
    setResults(prev => {
      const next = { ...prev };
      if (!next[studentId]) next[studentId] = {};
      next[studentId] = { ...next[studentId] };
      next[studentId][subAreaId] = { ...next[studentId][subAreaId], [field]: value === '' ? '' : Number(value) };
      return next;
    });
  }, []);

  const getStudentArea = (studentId, areaSubAreas) => {
    let totalScore = 0, totalOutOf = 0;
    const subResults = areaSubAreas.map(sa => {
      const r = results[studentId]?.[sa.sub_area_id] || {};
      const score = parseFloat(r.score);
      const outOf = parseFloat(r.out_of);
      const valid = !isNaN(score) && !isNaN(outOf) && outOf > 0;
      if (valid) { totalScore += score; totalOutOf += outOf; }
      return { ...sa, score: r.score ?? '', outOf: r.out_of ?? '', valid };
    });
    const pct = totalOutOf > 0 ? Math.round(totalScore / totalOutOf * 1000) / 10 : null;
    let level = null;
    if (pct !== null) {
      if (pct >= 80) level = 'EE';
      else if (pct >= 60) level = 'ME';
      else if (pct >= 40) level = 'AE';
      else level = 'BE';
    }
    return { subResults, totalScore, totalOutOf, pct, level };
  };

  async function handleSave() {
    setSaving(true);
    setMsg('');
    const payload = [];
    for (const studentId of Object.keys(results)) {
      for (const [subAreaId, r] of Object.entries(results[studentId])) {
        const score = parseFloat(r.score);
        const outOf = parseFloat(r.out_of);
        if (!isNaN(score) && !isNaN(outOf)) {
          payload.push({ student_id: studentId, sub_area_id: parseInt(subAreaId), score, out_of });
        }
      }
    }
    if (payload.length === 0) { setMsg('No scores to save'); setSaving(false); return; }
    try {
      await saveExamResultsOffline(sessionId, payload);
      if (navigator.onLine) {
        await saveExamResults(sessionId, payload, teacherId);
        setMsg(`Saved ${payload.length} scores`);
      } else {
        setMsg(`Saved ${payload.length} scores offline — will sync when online`);
      }
    } catch (e) {
      const errData = e?.response?.data;
      if (errData?.error === 'EXAM_POSTING_BLOCKED') {
        setMsg('⚠️ ' + errData.message);
      } else {
        setMsg('Save failed: ' + (errData?.message || e.message));
      }
    }
    setSaving(false);
  }

  const filteredStudents = students.filter(s => !classId || String(s.class_id) === String(classId));

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>CAT Exams</h1>
          <div />
        </div>
      </div>

      {premiumBlocked && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828' }}>
            <strong>⚠️ Premium Payment Required:</strong> The school has not paid the premium for this term. Exam results cannot be posted until payment is completed. Contact the headteacher.
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field text-sm">
              <option value="">Select class</option>
              {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="input-field text-sm">
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>CAT Session</label>
            <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="input-field text-sm">
              <option value="">Select session</option>
              {sessions.map(s => (
                <option key={s.session_id} value={s.session_id}>
                  {s.exam_type} — {s.exam_name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {session && (
          <div className="card p-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm">{session.exam_type}: {session.exam_name}</span>
              <span className="text-xs ml-2" style={{ color: '#888' }}>
                {session.open_date ? `Open: ${session.open_date}` : ''}
                {session.close_date ? ` — Close: ${session.close_date}` : ''}
              </span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              session.status === 'Open' ? 'bg-green-100 text-green-700' :
              session.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>{session.status}</span>
          </div>
        )}

        {classId && sessions.length === 0 && (
          <div className="card p-4 text-center text-sm" style={{ color: '#888' }}>
            No CAT sessions available. Ask your headteacher to create one.
          </div>
        )}

        {sessionId && classId && areas.map(area => {
          if (area.sub_areas.length === 0) return null;
          return (
            <div key={area.area_id} className="card overflow-hidden">
              <h3 className="px-4 py-2 font-bold text-sm" style={{ backgroundColor: '#F0F0FF', color: '#1a1a6c', borderBottom: '1px solid #E0E0E0' }}>
                {area.area_name}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: area.sub_areas.length * 120 + 160 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      <th className="text-left px-2 py-2 text-xs font-semibold uppercase sticky left-0 bg-gray-50 z-10" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', minWidth: 120 }}>Student</th>
                      {area.sub_areas.map(sa => (
                        <th key={sa.sub_area_id} className="text-center px-1 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', minWidth: 110 }}>
                          {sa.sub_area_name}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>Score / Out of</span>
                        </th>
                      ))}
                      <th className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', minWidth: 90 }}>
                        Total<br /><span style={{ fontSize: 9, fontWeight: 400 }}>Score / Level</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, si) => {
                      const { subResults, totalScore, totalOutOf, pct, level } = getStudentArea(s.student_id, area.sub_areas);
                      return (
                        <tr key={s.student_id} style={{ borderBottom: si < filteredStudents.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          <td className="px-2 py-2 text-sm sticky left-0 bg-white" style={{ color: '#333', fontWeight: 500 }}>
                            <div className="flex items-center justify-between gap-1">
                              <span>{s.full_name}</span>
                              <button
                                onClick={() => navigate(`/exams/report/${s.student_id}`)}
                                title="View report card"
                                style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, border: '1px solid #DDD', backgroundColor: '#FAFAFA', color: '#7B4F9B', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                Report
                              </button>
                            </div>
                          </td>
                          {subResults.map(sr => (
                            <td key={sr.sub_area_id} className="px-1 py-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-0.5">
                                <input type="number" min="0" step="0.5"
                                  value={sr.score === '' ? '' : sr.score}
                                  disabled={isClosed}
                                  onChange={e => updateScore(s.student_id, sr.sub_area_id, 'score', e.target.value)}
                                  className="w-14 text-center py-1 rounded border text-xs"
                                  style={{ borderColor: '#E0E0E0' }}
                                />
                                <span className="text-xs" style={{ color: '#999' }}>/</span>
                                <input type="number" min="0" step="0.5"
                                  value={sr.outOf === '' ? '' : sr.outOf}
                                  disabled={isClosed}
                                  onChange={e => updateScore(s.student_id, sr.sub_area_id, 'out_of', e.target.value)}
                                  className="w-14 text-center py-1 rounded border text-xs"
                                  style={{ borderColor: '#E0E0E0' }}
                                />
                              </div>
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center font-bold text-sm">
                            {totalOutOf > 0 ? (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
                                  {totalScore}/{totalOutOf}
                                </div>
                                {level && (
                                  <span style={{
                                    display: 'inline-block', marginTop: 2,
                                    padding: '1px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                                    backgroundColor: level === 'EE' ? '#E8F5E9' : level === 'ME' ? '#E3F2FD' : level === 'AE' ? '#FFF3E0' : '#FFEBEE',
                                    color: level === 'EE' ? '#2E7D32' : level === 'ME' ? '#1565C0' : level === 'AE' ? '#E65100' : '#C62828',
                                  }}>{level}</span>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!isClosed && (
                <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#888' }}>{filteredStudents.length} students</span>
                  <button onClick={handleSave} disabled={saving} className="btn-primary !w-auto px-6 !py-2 !text-sm">
                    {saving ? 'Saving...' : 'Save All'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {msg && (
          <div className="text-sm text-center py-2 rounded-lg" style={{
            backgroundColor: msg.includes('Failed') || msg.includes('failed') ? '#FFEBEE' : '#E8F5E9',
            color: msg.includes('Failed') || msg.includes('failed') ? '#C62828' : '#2E7D32'
          }}>{msg}</div>
        )}
      </div>
    </div>
  );
}
