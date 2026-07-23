import { getUnsyncedLogs, markSynced } from './indexedDB.js';
import { syncAttendance } from './api.js';

let intervalId = null;

export async function pushUnsynced() {
  if (!navigator.onLine) return;
  const logs = await getUnsyncedLogs();
  if (logs.length === 0) return;
  try {
    const payload = logs.map(l => ({
      student_id: l.student_id,
      date: l.date,
      status: l.status,
      teacher_id: l.teacher_id
    }));
    await syncAttendance(payload);
    await markSynced(logs.map(l => l.id));
    console.log(`Synced ${logs.length} records`);
  } catch (e) {
    console.warn('Sync failed, will retry:', e.message);
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
