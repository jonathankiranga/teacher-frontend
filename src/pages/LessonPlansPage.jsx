import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudents } from '../utils/api.js';
import { getLearningAreas, getStrands, getSubStrands, getLessonPlans, createLessonPlan, updateLessonPlan, deleteLessonPlan } from '../utils/api.js';

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function LessonPlanModal({ plan, schoolId, onClose, onSaved }) {
  const [areas, setAreas] = useState([]);
  const [strands, setStrands] = useState([]);
  const [subStrands, setSubStrands] = useState([]);
  const [classes, setClasses] = useState([]);
  const [areaId, setAreaId] = useState(plan?.area_id || '');
  const [strandId, setStrandId] = useState(plan?.strand_id || '');
  const [subStrandId, setSubStrandId] = useState(plan?.sub_strand_id || '');
  const [classId, setClassId] = useState(plan?.class_id || '');
  const [weekNumber, setWeekNumber] = useState(plan?.week_number || 1);
  const [term, setTerm] = useState(plan?.term || 'Term 1');
  const [lessonDate, setLessonDate] = useState(toDateInput(plan?.lesson_date));
  const [duration, setDuration] = useState(plan?.duration_minutes || 40);
  const [objectives, setObjectives] = useState(plan?.learning_objectives || '');
  const [resources, setResources] = useState(plan?.resources || '');
  const [introduction, setIntroduction] = useState(plan?.introduction_activities || '');
  const [mainActivities, setMainActivities] = useState(plan?.main_activities || '');
  const [assessmentMethod, setAssessmentMethod] = useState(plan?.assessment_method || '');
  const [remarks, setRemarks] = useState(plan?.remarks || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const teacherId = sessionStorage.getItem('teacher_id');
    if (schoolId) {
      getLearningAreas(schoolId, '').then(d => setAreas((d.areas || []).map(a => ({ value: a.area_id, label: a.area_name })))).catch(() => {});
    }
    if (teacherId) {
      fetchStudents(teacherId).then(data => {
        const list = data.students || [];
        const classMap = {};
        list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
        setClasses(Object.entries(classMap).map(([id, name]) => ({ value: id, label: name })));
      }).catch(() => {});
    }
  }, [schoolId]);

  useEffect(() => {
    if (areaId) getStrands(areaId, term).then(d => setStrands((d.strands || []).map(s => ({ value: s.strand_id, label: s.strand_name })))).catch(() => {});
    else setStrands([]);
  }, [areaId, term]);

  useEffect(() => {
    if (strandId) getSubStrands(strandId).then(d => setSubStrands((d.sub_strands || []).map(s => ({ value: s.sub_strand_id, label: s.sub_strand_name })))).catch(() => {});
    else setSubStrands([]);
  }, [strandId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!classId || !areaId) { setError('Class and Learning Area are required'); return; }
    setLoading(true);
    setError('');
    const teacherId = sessionStorage.getItem('teacher_id');
    const body = {
      teacher_id: teacherId,
      school_id: schoolId,
      class_id: classId,
      area_id: areaId,
      strand_id: strandId || null,
      sub_strand_id: subStrandId || null,
      week_number: weekNumber,
      term,
      lesson_date: lessonDate || null,
      duration_minutes: duration,
      learning_objectives: objectives || null,
      resources: resources || null,
      introduction_activities: introduction || null,
      main_activities: mainActivities || null,
      assessment_method: assessmentMethod || null,
      remarks: remarks || null
    };
    try {
      if (plan) { await updateLessonPlan(plan.plan_id, body); }
      else { await createLessonPlan(body); }
      onSaved();
      onClose();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-card shadow-xl p-6 w-full max-w-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>{plan ? 'Edit Lesson Plan' : 'New Lesson Plan'}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#888' }}>X</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field" required>
                <option value="">-- Select --</option>
                {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)} className="input-field">
                <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Learning Area</label>
              <select value={areaId} onChange={e => { setAreaId(e.target.value); setStrandId(''); setSubStrandId(''); }} className="input-field" required>
                <option value="">-- Select --</option>
                {areas.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Strand</label>
              <select value={strandId} onChange={e => { setStrandId(e.target.value); setSubStrandId(''); }} className="input-field">
                <option value="">-- Select --</option>
                {strands.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Sub-strand</label>
              <select value={subStrandId} onChange={e => setSubStrandId(e.target.value)} className="input-field">
                <option value="">-- Select --</option>
                {subStrands.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Week</label>
              <input type="number" min="1" max="14" value={weekNumber} onChange={e => setWeekNumber(parseInt(e.target.value) || 1)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Duration (min)</label>
              <input type="number" min="10" max="120" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 40)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Lesson Date</label>
            <input type="date" value={lessonDate} onChange={e => setLessonDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Learning Objectives</label>
            <textarea value={objectives} onChange={e => setObjectives(e.target.value)} className="input-field" rows={2} placeholder="What students should achieve..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Resources / Materials</label>
            <textarea value={resources} onChange={e => setResources(e.target.value)} className="input-field" rows={2} placeholder="Books, tools, materials needed..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Introduction Activities</label>
            <textarea value={introduction} onChange={e => setIntroduction(e.target.value)} className="input-field" rows={2} placeholder="Starter activity, recap, hook..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Main Activities</label>
            <textarea value={mainActivities} onChange={e => setMainActivities(e.target.value)} className="input-field" rows={3} placeholder="Step-by-step teaching activities..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Assessment Method</label>
            <textarea value={assessmentMethod} onChange={e => setAssessmentMethod(e.target.value)} className="input-field" rows={2} placeholder="How learning will be assessed..." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="input-field" rows={2} placeholder="Notes, reflections..." />
          </div>
          {error && <p className="text-xs" style={{ color: '#C62828' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#7B4F9B' }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LessonPlansPage() {
  const navigate = useNavigate();
  const teacherId = sessionStorage.getItem('teacher_id');
  const schoolId = sessionStorage.getItem('school_id');
  const [plans, setPlans] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('Term 1');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    if (!teacherId) navigate('/teacher/login', { replace: true });
  }, [teacherId, navigate]);

  useEffect(() => {
    if (!teacherId) return;
    fetchStudents(teacherId).then(data => {
      const list = data.students || [];
      const classMap = {};
      list.forEach(s => { if (s.class_id) classMap[s.class_id] = s.class_name || 'Class'; });
      setClasses(Object.entries(classMap).map(([id, name]) => ({ value: id, label: name })));
    }).catch(() => {});
  }, [teacherId]);

  async function loadPlans() {
    setLoading(true);
    try {
      const params = { school_id: schoolId };
      if (filterClass) params.class_id = filterClass;
      if (filterTerm) params.term = filterTerm;
      const data = await getLessonPlans(params);
      setPlans(data.lesson_plans || []);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { if (schoolId) loadPlans(); }, [schoolId, filterClass, filterTerm]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this lesson plan?')) return;
    try { await deleteLessonPlan(id); loadPlans(); } catch (e) {}
  }

  function handleEdit(plan) {
    setEditingPlan(plan);
    setShowModal(true);
  }

  return (
    <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh', paddingBottom: 70 }}>
      <div className="navbar px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="btn-ghost text-sm">Back</button>
          <h1 className="text-base font-bold" style={{ color: '#333' }}>Lesson Plans</h1>
          <button onClick={() => { setEditingPlan(null); setShowModal(true); }} className="btn-secondary text-sm">+ New</button>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input-field">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="input-field">
            <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B4F9B', borderTopColor: 'transparent' }} />
          </div>
        ) : plans.length === 0 ? (
          <div className="card p-12 text-center border border-gray-200">
            <p className="text-sm" style={{ color: '#888' }}>No lesson plans yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.plan_id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: '#333' }}>{plan.area_name}</h3>
                    {plan.strand_name && <p className="text-xs mt-0.5" style={{ color: '#666' }}>Strand: {plan.strand_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEdit(plan)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'rgba(123,79,155,0.08)', color: '#7B4F9B' }}>Edit</button>
                    <button onClick={() => handleDelete(plan.plan_id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#888' }}>
                  <span>{plan.class_name}</span>
                  <span>Week {plan.week_number}</span>
                  <span>{plan.term}</span>
                  <span>{plan.duration_minutes} min</span>
                  {plan.lesson_date && <span>{new Date(plan.lesson_date).toLocaleDateString()}</span>}
                </div>
                {plan.learning_objectives && (
                  <div className="mt-2 text-xs" style={{ color: '#555' }}>
                    <span className="font-medium">Objectives: </span>{plan.learning_objectives.substring(0, 120)}{plan.learning_objectives.length > 120 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <LessonPlanModal
          plan={editingPlan}
          schoolId={schoolId}
          onClose={() => { setShowModal(false); setEditingPlan(null); }}
          onSaved={loadPlans}
        />
      )}
    </div>
  );
}
