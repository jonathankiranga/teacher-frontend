import { getUnsyncedLogs, markSynced, getUnsyncedAssessmentResults, markAssessmentSynced } from './indexedDB.js';
import { syncAttendance, saveResults } from './api.js';

let intervalId = null;

export async function pushUnsynced() {
  if (!navigator.onLine) return;

  // Sync attendance
  const logs = await getUnsyncedLogs();
  if (logs.length > 0) {
    try {
      const payload = logs.map(l => ({
        student_id: l.student_id,
        date: l.date,
        status: l.status,
        teacher_id: l.teacher_id
      }));
      await syncAttendance(payload);
      await markSynced(logs.map(l => l.id));
      console.log(`Synced ${logs.length} attendance records`);
    } catch (e) {
      console.warn('Attendance sync failed, will retry:', e.message);
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
}

export function startSync(intervalMs = 300000) {
  window.addEventListener('online', pushUnsynced);
  intervalId = setInterval(pushUnsynced, intervalMs);
}

export function stopSync() {
  window.removeEventListener('online', pushUnsynced);
  if (intervalId) clearInterval(intervalId);
}
