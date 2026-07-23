import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sms-backend-r0tn.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export async function requestTeacherOtp(phone) {
  const { data } = await api.post('/api/teachers/request-otp', { phone });
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

export async function syncAttendance(records) {
  const { data } = await api.post('/api/attendance/sync', { records });
  return data;
}

export async function searchSchools(query) {
  const { data } = await api.get('/api/schools/search', { params: { q: query } });
  return data;
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

export async function subscribePush(teacherId, subscription) {
  const { data } = await api.post('/api/webpush/subscribe', { teacher_id: teacherId, subscription });
  return data;
}

export async function unsubscribePush(teacherId) {
  const { data } = await api.post('/api/webpush/unsubscribe', { teacher_id: teacherId });
  return data;
}

export default api;
