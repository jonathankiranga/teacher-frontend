import { getUnsyncedLogs, markSynced, getUnsyncedAssessmentResults, markAssessmentSynced, getUnsyncedExamResults, markExamResultsSynced } from './indexedDB.js';
import { syncAttendance, saveResults, saveExamResults } from './api.js';

let intervalId = null;

export async function pushUnsynced() {
  if (!navigator.onLine) return;

  // Sync attendance — group by date and send the school/teacher/date/records shape the API expects
  const logs = await getUnsyncedLogs();
  if (logs.length > 0) {
    const byDate = {};
    for (const l of logs) {
      const d = l.date || l.attendance_date;
      if (!d) continue;
      if (!byDate[d]) byDate[d] = { ids: [], records: [], schoolId: l.school_id || sessionStorage.getItem('school_id') || '' };
      byDate[d].ids.push(l.id);
      byDate[d].records.push({ student_id: l.student_id, status: l.status, marked_at: l.marked_at || l.created_at || null });
    }
    for (const [date, g] of Object.entries(byDate)) {
      const teacherId = g.records[0] && logs.find(l => l.id === g.ids[0])?.teacher_id;
      try {
        await syncAttendance({
          school_id: g.schoolId,
          teacher_id: teacherId || sessionStorage.getItem('teacher_id') || '',
          attendance_date: date,
          records: g.records
        });
        await markSynced(g.ids);
        console.log(`Synced ${g.records.length} attendance records for ${date}`);
      } catch (e) {
        console.warn(`Attendance sync failed for ${date}, will retry:`, e.message);
      }
    }
  }

  // Sync assessment results
  const results = await getUnsyncedAssessmentResults();
  if (results.length > 0) {
    const groups = {};
    for (const r of results) {
      if (!groups[r.assessment_id]) groups[r.assessment_id] = { ids: [], results: [] };
      groups[r.assessment_id].ids.push(r.id);
      groups[r.assessment_id].results.push({ student_id: r.student_id, score: r.score, max_score: 100 });
    }
    for (const [assessmentId, group] of Object.entries(groups)) {
      try {
        await saveResults(assessmentId, group.results);
        await markAssessmentSynced(group.ids);
        console.log(`Synced ${group.results.length} assessment results for assessment ${assessmentId}`);
      } catch (e) {
        console.warn(`Assessment sync failed for ${assessmentId}, will retry:`, e.message);
      }
    }
  }

  // Sync exam results
  const examResults = await getUnsyncedExamResults();
  if (examResults.length > 0) {
    const groups = {};
    for (const r of examResults) {
      if (!groups[r.session_id]) groups[r.session_id] = { ids: [], results: [] };
      groups[r.session_id].ids.push(r.id);
      groups[r.session_id].results.push({ student_id: r.student_id, sub_area_id: r.sub_area_id, score: r.score, out_of: r.out_of });
    }
    for (const [sessionId, group] of Object.entries(groups)) {
      try {
        await saveExamResults(sessionId, group.results, group.results[0]?.entered_by || 'SYSTEM');
        await markExamResultsSynced(group.ids);
        console.log(`Synced ${group.results.length} exam results for session ${sessionId}`);
      } catch (e) {
        console.warn(`Exam results sync failed for session ${sessionId}, will retry:`, e.message);
      }
    }
  }
}

const safePush = () => pushUnsynced().catch(() => {});

function handleSwMessage(event) {
  if (event.data?.type === 'SYNC_OFFLINE_DATA') {
    safePush();
  }
}

export function startSync(intervalMs = 300000) {
  window.addEventListener('online', safePush);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    if ('SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.sync.register('sync-offline-data').catch(() => {});
      }).catch(() => {});
    }
  }
  intervalId = setInterval(safePush, intervalMs);
}

export function stopSync() {
  window.removeEventListener('online', safePush);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }
  if (intervalId) clearInterval(intervalId);
}
