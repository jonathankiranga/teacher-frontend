import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudents, getCompetencies, getClassCompetencyRatings, saveCompetencyRatings } from '../utils/api.js';

function getLevelColor(level) {
  if (level === 'EE') return { bg: '#E8F5E9', text: '#2E7D32' };
  if (level === 'ME') return { bg: '#E3F2FD', text: '#1565C0' };
  if (level === 'AE') return { bg: '#FFF3E0', text: '#E65100' };
  if (level === 'BE') return { bg: '#FFEBEE', text: '#C62828' };
  return { bg: '#F5F5F5', text: '#888' };
}

export default function CompetencyRatingsPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [students, setStudents] = useState([]);
  const [competencyDefs, setCompetencyDefs] = useState({ competencies: [], values: [] });
  const [ratings, setRatings] = useState({});
  const [activeTab, setActiveTab] = useState('competency');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!teacherId) navigate('/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    if (!teacherId) return;
    fetchStudents(teacherId).then(data => {
      const list = data.students || [];
      const classMap = {};
      list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
      setClasses(Object.entries(classMap).map(([id, name]) => ({ value: id, label: name })));
    }).catch(() => {});
    getCompetencies().then(setCompetencyDefs).catch(() => {});
  }, [teacherId]);

  useEffect(() => {
    if (classId && term) {
      setLoading(true);
      setRatings({});
      setDirty(false);
      Promise.all([
        fetchStudents(teacherId).then(d => {
          setStudents((d.students || []).filter(s => String(s.class_id) === String(classId)));
        }),
        getClassCompetencyRatings(classId, term).then(d => {
          const map = {};
          (d.ratings || []).forEach(r => {
            map[`${r.student_id}_${r.competency_id}`] = r.rating;
          });
          setRatings(map);
          setLoading(false);
        })
      ]).catch(() => setLoading(false));
    }
  }, [classId, term]);

  function handleRating(studentId, competencyId, value) {
    setRatings(prev => ({ ...prev, [`${studentId}_${competencyId}`]: value }));
    setDirty(true);
  }

  async function handleSave() {
    const defs = activeTab === 'competency' ? competencyDefs.competencies : competencyDefs.values;
    const payload = [];
    students.forEach(s => {
      defs.forEach(d => {
        const key = `${s.student_id}_${d.competency_id}`;
        const rating = ratings[key];
        if (rating) {
          payload.push({ student_id: s.student_id, term, competency_id: d.competency_id, rating, teacher_id: teacherId });
        }
      });
    });
    if (payload.length === 0) return;
    setSaving(true);
    try {
      await saveCompetencyRatings(payload);
      setDirty(false);
      alert('Ratings saved successfully');
    } catch (e) { alert('Failed to save ratings'); }
    setSaving(false);
  }

  const defs = activeTab === 'competency' ? competencyDefs.competencies : competencyDefs.values;
  const title = activeTab === 'competency' ? 'Core Competencies' : 'Core Values';

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Competency & Values Ratings</h1>
          <button onClick={handleSave} disabled={saving || !dirty} className="btn-secondary text-sm">
            {saving ? 'Saving...' : dirty ? 'Save All *' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field" style={{ maxWidth: 200 }}>
            <option value="">— Select Class —</option>
            {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={term} onChange={e => setTerm(e.target.value)} className="input-field" style={{ maxWidth: 150 }}>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <div className="flex gap-1 ml-2">
            <button onClick={() => setActiveTab('competency')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'competency' ? 'text-white' : 'text-gray-600 bg-gray-100'}`}
              style={{ backgroundColor: activeTab === 'competency' ? '#7B4F9B' : undefined }}>
              Core Competencies (7)
            </button>
            <button onClick={() => setActiveTab('value')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'value' ? 'text-white' : 'text-gray-600 bg-gray-100'}`}
              style={{ backgroundColor: activeTab === 'value' ? '#7B4F9B' : undefined }}>
              Core Values (7)
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
          </div>
        )}

        {!loading && classId && (
          <div className="overflow-x-auto">
            <div className="card">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold" style={{ color: '#333' }}>{title}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>Rate each student on the 4-point CBC scale (EE, ME, AE, BE)</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase sticky left-0" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', backgroundColor: '#FAFAFA', zIndex: 1, minWidth: 140 }}>Student</th>
                    {defs.map(d => (
                      <th key={d.competency_id} className="text-center px-2 py-2 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0', minWidth: 90 }}>{d.competency_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={defs.length + 1} className="text-center py-8 text-sm" style={{ color: '#888' }}>No students found in this class.</td>
                    </tr>
                  ) : (students.map((s, idx) => (
                    <tr key={s.student_id} style={{ borderBottom: idx < students.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-3 py-1.5 text-sm font-medium sticky left-0" style={{ color: '#333', backgroundColor: '#fff', zIndex: 1, minWidth: 140 }}>{s.full_name}</td>
                      {defs.map(d => {
                        const key = `${s.student_id}_${d.competency_id}`;
                        const val = ratings[key] || '';
                        const c = val ? getLevelColor(val) : {};
                        return (
                          <td key={d.competency_id} className="px-2 py-1.5 text-center">
                            <select value={val} onChange={e => handleRating(s.student_id, d.competency_id, e.target.value)}
                              className="text-xs px-1 py-1 rounded border text-center font-semibold w-16"
                              style={{
                                borderColor: val ? c.text : '#D0D0D0',
                                backgroundColor: val ? c.bg : '#fff',
                                color: val ? c.text : '#888',
                                outline: 'none'
                              }}>
                              <option value="">—</option>
                              <option value="EE">EE</option>
                              <option value="ME">ME</option>
                              <option value="AE">AE</option>
                              <option value="BE">BE</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!classId && !loading && (
          <div className="card p-12 text-center border border-gray-200">
            <p className="text-sm" style={{ color: '#888' }}>Select a class and term to begin rating competencies and values.</p>
          </div>
        )}
      </div>

      <style>{`
        @media print { .navbar { display: none !important; } body { background: white !important; } }
      `}</style>
    </div>
  );
}
