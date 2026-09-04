import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://sms-backend-r0tn.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const sessionId = sessionStorage.getItem('session_id');
  if (sessionId) config.headers.Authorization = `Bearer ${sessionId}`;
  return config;
});

/**
 * Waits for the Render backend to wake up before proceeding.
 *
 * Render free-tier instances spin down after inactivity. The first request
 * after sleep can take 30–60 seconds. This function polls /health (a fast,
 * DB-free endpoint) with short retries until it gets { status: 'ok' }, so
 * callers don't fire real API requests into a cold-starting server and get
 * spurious network errors or timeouts.
 *
 * @param {object} [options]
 * @param {number} [options.maxWaitMs=90000]  Give up after this many ms total
 * @param {number} [options.intervalMs=3000]  How long to wait between pings
 * @param {function} [options.onWaiting]      Called on first failed ping so UI can show a spinner
 * @returns {Promise<boolean>} true when server is ready, false if maxWaitMs exceeded
 */
export async function waitForServer({ maxWaitMs = 90000, intervalMs = 3000, onWaiting } = {}) {
  const start = Date.now();
  let notified = false;

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (res.data?.status === 'ok') return true;
    } catch {
      // Server not up yet — keep polling
    }

    if (!notified) {
      notified = true;
      if (typeof onWaiting === 'function') onWaiting();
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return false; // timed out
}

export async function requestTeacherOtp(body) {
  const { data } = await api.post('/api/teachers/request-otp', body);
  return data;
}

export async function verifyTeacherOtp(session_id, code) {
  const { data } = await api.post('/api/teachers/verify-otp', { session_id, code });
  return data;
}

export async function fetchStudents(teacherId) {
  const { data } = await api.get(`/api/attendance/students/${teacherId}`);
  return data;
}

export async function syncAttendance(payload) {
  const { data } = await api.post('/api/attendance/sync', payload);
  return data;
}

export async function searchSchools(query) {
  const { data } = await api.get('/api/schools/search', { params: { q: query } });
  return data;
}

export async function getSchoolClasses(schoolId) {
  const { data } = await api.get('/api/fees/classes', { params: { school_id: schoolId } });
  return data.classes || [];
}

export async function getLearningAreas(schoolId, level) {
  const { data } = await api.get('/api/assessments/areas', { params: { school_id: schoolId, level } });
  return data;
}

export async function getStrands(areaId, term) {
  const { data } = await api.get('/api/assessments/strands', { params: { area_id: areaId, term } });
  return data;
}

export async function getSubStrands(strandId) {
  const { data } = await api.get('/api/assessments/sub-strands', { params: { strand_id: strandId } });
  return data;
}

export async function createAssessment(body) {
  const { data } = await api.post('/api/assessments', body);
  return data;
}

export async function getAssessments(classId, term) {
  const { data } = await api.get('/api/assessments', { params: { class_id: classId, term } });
  return data;
}

export async function saveResults(assessmentId, results) {
  const { data } = await api.post('/api/assessments/results', { assessment_id: assessmentId, results });
  return data;
}

export async function getAssessmentResults(assessmentId) {
  const { data } = await api.get(`/api/assessments/results/${assessmentId}`);
  return data;
}

export async function getStudentReport(studentId, term) {
  const { data } = await api.get(`/api/assessments/report/${studentId}/${term}`);
  return data;
}

export async function getCumulativeReport(studentId, year) {
  const { data } = await api.get(`/api/assessments/report/${studentId}/cumulative/${year}`);
  return data;
}

// Lesson Plans
export async function getLessonPlans(params) {
  const { data } = await api.get('/api/lesson-plans', { params });
  return data;
}

export async function getLessonPlan(id) {
  const { data } = await api.get(`/api/lesson-plans/${id}`);
  return data;
}

export async function createLessonPlan(body) {
  const { data } = await api.post('/api/lesson-plans', body);
  return data;
}

export async function updateLessonPlan(id, body) {
  const { data } = await api.put(`/api/lesson-plans/${id}`, body);
  return data;
}

export async function deleteLessonPlan(id) {
  const { data } = await api.delete(`/api/lesson-plans/${id}`);
  return data;
}

// Class Report
export async function getClassReport(classId, term, year) {
  const { data } = await api.get(`/api/assessments/class-report/${classId}/${term}`, {
    params: year ? { year } : {}
  });
  return data;
}

export async function subscribePush(teacherId, subscription) {
  const { data } = await api.post('/api/webpush/subscribe', { teacher_id: teacherId, subscription });
  return data;
}

export async function unsubscribePush(teacherId) {
  const { data } = await api.post('/api/webpush/unsubscribe', { teacher_id: teacherId });
  return data;
}

// Competencies & Values
export async function getCompetencies() {
  const { data } = await api.get('/api/competencies');
  return data;
}

export async function getStudentCompetencyRatings(studentId, term) {
  const { data } = await api.get(`/api/competencies/ratings/${studentId}/${term}`);
  return data;
}

export async function getClassCompetencyRatings(classId, term) {
  const { data } = await api.get(`/api/competencies/class-ratings/${classId}/${term}`);
  return data;
}

export async function saveCompetencyRatings(ratings) {
  const { data } = await api.post('/api/competencies/ratings', { ratings });
  return data;
}

// ─── Exam Sessions (CAT) ─────────────────────────────────────────

export async function getExamSessions(params) {
  const { data } = await api.get('/api/exam-sessions', { params });
  return data;
}

export async function getLearningAreasWithSubAreas(schoolId) {
  const { data } = await api.get('/api/exam-sessions/sub-learning-areas', { params: { school_id: schoolId } });
  return data;
}

export async function getExamSessionResults(sessionId) {
  const { data } = await api.get(`/api/exam-sessions/${sessionId}/results`);
  return data;
}

export async function saveExamResults(sessionId, results, enteredBy) {
  const { data } = await api.post(`/api/exam-sessions/${sessionId}/results`, { results, entered_by: enteredBy });
  return data;
}

export async function getExamClassReport(sessionId) {
  const { data } = await api.get(`/api/exam-sessions/${sessionId}/class-report`);
  return data;
}

export default api;
