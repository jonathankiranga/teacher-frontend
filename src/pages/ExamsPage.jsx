import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../components/Dropdown.jsx';
import { fetchStudents } from '../utils/api.js';
import { getLearningAreas, getStrands, getSubStrands, createAssessment, getAssessments, saveResults, getAssessmentResults } from '../utils/api.js';
import { saveAssessmentResults as saveOffline, getUnsyncedAssessmentResults } from '../utils/indexedDB.js';

export default function ExamsPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState('');
  const [strands, setStrands] = useState([]);
  const [strandId, setStrandId] = useState('');
  const [subStrands, setSubStrands] = useState([]);
  const [subStrandId, setSubStrandId] = useState('');
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newAssessmentName, setNewAssessmentName] = useState('');

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  // Load classes from roster/students
  useEffect(() => {
    if (!teacherId) return;
    fetchStudents(teacherId).then(data => {
      const list = data.students || [];
      const classMap = {};
      list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
      const cls = Object.entries(classMap).map(([id, name]) => ({ value: id, label: name }));
      setClasses(cls);
      setStudents(list);
    }).catch(() => {});
  }, [teacherId]);

  useEffect(() => {
    if (schoolId) getLearningAreas(schoolId, 'Grade 4').then(d => setAreas((d.areas || []).map(a => ({ value: a.area_id, label: a.area_name })))).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (areaId) getStrands(areaId, 'Term 1').then(d => setStrands((d.strands || []).map(s => ({ value: s.strand_id, label: s.strand_name })))).catch(() => {});
  }, [areaId]);

  useEffect(() => {
    if (strandId) getSubStrands(strandId).then(d => setSubStrands((d.sub_strands || []).map(s => ({ value: s.sub_strand_id, label: s.sub_strand_name })))).catch(() => {});
  }, [strandId]);

  useEffect(() => {
    if (classId) getAssessments(classId, 'Term 1').then(d => setAssessments((d.assessments || []).map(a => ({ value: a.assessment_id, label: a.assessment_name })))).catch(() => {});
  }, [classId]);

  async function handleCreateAssessment() {
    if (!subStrandId || !newAssessmentName || !classId) return;
    try {
      await createAssessment({ sub_strand_id: subStrandId, assessment_name: newAssessmentName, max_score: 100, class_id: classId, teacher_id: teacherId });
      setNewAssessmentName('');
      const d = await getAssessments(classId, 'Term 1');
      setAssessments((d.assessments || []).map(a => ({ value: a.assessment_id, label: a.assessment_name })));
      setMsg('Assessment created');
    } catch (e) { setMsg('Failed to create'); }
  }

  async function handleLoadAssessment() {
    if (!selectedAssessment) return;
    try {
      const d = await getAssessmentResults(selectedAssessment);
      const map = {};
      (d.results || []).forEach(r => { map[r.student_id] = r.score; });
      setScores(map);
    } catch (e) { /* ignore */ }
  }

  useEffect(() => { if (selectedAssessment) handleLoadAssessment(); }, [selectedAssessment]);

  function handleScoreChange(studentId, val) {
    setScores(p => ({ ...p, [studentId]: val === '' ? null : Number(val) }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg('');
    const results = students
      .filter(s => scores[s.student_id] !== undefined && scores[s.student_id] !== null)
      .map(s => ({ student_id: s.student_id, score: scores[s.student_id], max_score: 100 }));
    if (results.length === 0) { setMsg('No scores entered'); setSaving(false); return; }
    try {
      await saveOffline(selectedAssessment, results);
      if (navigator.onLine) {
        await saveResults(selectedAssessment, results);
        setMsg('Saved & synced');
      } else {
        setMsg('Saved offline — will sync when online');
      }
    } catch (e) { setMsg('Save failed'); }
    setSaving(false);
  }

  const filteredStudents = students.filter(s => !classId || String(s.class_id) === String(classId));

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">← Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Exams & Assessment</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Row 1: Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Dropdown label="Class" options={classes} value={classId} onChange={setClassId} placeholder="Select class" />
          <Dropdown label="Learning Area" options={areas} value={areaId} onChange={setAreaId} placeholder="Select area" />
          <Dropdown label="Strand" options={strands} value={strandId} onChange={setStrandId} placeholder="Select strand" />
          <Dropdown label="Sub-strand" options={subStrands} value={subStrandId} onChange={setSubStrandId} placeholder="Select sub" />
        </div>

        {/* Row 2: Create assessment */}
        <div className="card p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>New Assessment</label>
              <input value={newAssessmentName} onChange={e => setNewAssessmentName(e.target.value)} className="input-field" placeholder="e.g. Quiz 3 - Addition" />
            </div>
            <button onClick={handleCreateAssessment} className="btn-secondary text-sm h-11">Create</button>
          </div>
        </div>

        {/* Row 3: Select existing assessment */}
        <Dropdown label="Select Assessment to enter scores" options={assessments} value={selectedAssessment} onChange={setSelectedAssessment} placeholder="Choose assessment" />

        {/* Score entry table */}
        {selectedAssessment && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Student</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Score / 100</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#888', borderBottom: '1px solid #E0E0E0' }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => {
                  const score = scores[s.student_id];
                  const pct = score !== undefined && score !== null ? score / 100 : null;
                  let level = '';
                  if (pct !== null) {
                    if (pct >= 0.8) level = 'EE';
                    else if (pct >= 0.6) level = 'ME';
                    else if (pct >= 0.4) level = 'AE';
                    else level = 'BE';
                  }
                  return (
                    <tr key={s.student_id} style={{ borderBottom: i < filteredStudents.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: '#333' }}>{s.full_name}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={score !== undefined && score !== null ? score : ''}
                          onChange={e => handleScoreChange(s.student_id, e.target.value)}
                          className="w-20 text-center py-1.5 rounded-lg border text-sm"
                          style={{ borderColor: '#E0E0E0' }}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {level && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{
                            backgroundColor: level === 'EE' ? '#E8F5E9' : level === 'ME' ? '#E3F2FD' : level === 'AE' ? '#FFF3E0' : '#FFEBEE',
                            color: level === 'EE' ? '#2E7D32' : level === 'ME' ? '#1565C0' : level === 'AE' ? '#E65100' : '#C62828'
                          }}>
                            {level}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs" style={{ color: '#888' }}>{filteredStudents.length} students</span>
              <button onClick={handleSave} disabled={saving} className="btn-primary !w-auto px-8 !py-2.5 !text-sm">{saving ? 'Saving...' : 'Save All'}</button>
            </div>
          </div>
        )}

        {msg && <div className="text-sm text-center py-2 rounded-lg" style={{ backgroundColor: msg.includes('Failed') ? '#FFEBEE' : '#E8F5E9', color: msg.includes('Failed') ? '#C62828' : '#2E7D32' }}>{msg}</div>}
      </div>
    </div>
  );
}
