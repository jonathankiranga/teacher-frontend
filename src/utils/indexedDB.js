const DB_NAME = 'sms_offline';
const DB_VERSION = 2;
const STORE_NAME = 'attendance';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('roster')) {
        const roster = db.createObjectStore('roster', { keyPath: 'student_id' });
        roster.createIndex('teacher_id', 'teacher_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('assessment_results')) {
        const ar = db.createObjectStore('assessment_results', { keyPath: 'id', autoIncrement: true });
        ar.createIndex('synced', 'synced', { unique: false });
        ar.createIndex('assessment_id', 'assessment_id', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Assessment offline helpers
export async function saveAssessmentResults(assessmentId, results) {
  const db = await openDB();
  const tx = db.transaction('assessment_results', 'readwrite');
  const store = tx.objectStore('assessment_results');
  for (const r of results) {
    store.put({ ...r, assessment_id: assessmentId, synced: 0 });
  }
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

export async function getUnsyncedAssessmentResults() {
  const db = await openDB();
  const tx = db.transaction('assessment_results', 'readonly');
  const store = tx.objectStore('assessment_results');
  const index = store.index('synced');
  const rows = await new Promise((r) => { const req = index.getAll(0); req.onsuccess = () => r(req.result); });
  db.close();
  return rows;
}

export async function markAssessmentSynced(ids) {
  const db = await openDB();
  const tx = db.transaction('assessment_results', 'readwrite');
  const store = tx.objectStore('assessment_results');
  for (const id of ids) {
    const rec = await new Promise((r) => { const req = store.get(id); req.onsuccess = () => r(req.result); });
    if (rec) { rec.synced = 1; store.put(rec); }
  }
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

export async function saveRoster(students) {
  const db = await openDB();
  const tx = db.transaction('roster', 'readwrite');
  const store = tx.objectStore('roster');
  for (const s of students) store.put(s);
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

export async function getRoster(teacherId) {
  const db = await openDB();
  const tx = db.transaction('roster', 'readonly');
  const store = tx.objectStore('roster');
  const index = store.index('teacher_id');
  const students = await new Promise((r) => {
    const req = index.getAll(teacherId);
    req.onsuccess = () => r(req.result);
  });
  db.close();
  return students;
}

export async function saveAttendance(date, records) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const r of records) {
    store.put({ ...r, date, synced: 0, created_at: new Date().toISOString() });
  }
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

export async function getUnsyncedLogs() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('synced');
  const logs = await new Promise((r) => {
    const req = index.getAll(0);
    req.onsuccess = () => r(req.result);
  });
  db.close();
  return logs;
}

export async function markSynced(ids) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const id of ids) {
    const record = await new Promise((r) => {
      const req = store.get(id);
      req.onsuccess = () => r(req.result);
    });
    if (record) {
      record.synced = 1;
      store.put(record);
    }
  }
  await new Promise((r) => { tx.oncomplete = r; });
  db.close();
}

export async function getAttendanceByDate(date, teacherId) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('date');
  const all = await new Promise((r) => {
    const req = index.getAll(date);
    req.onsuccess = () => r(req.result);
  });
  db.close();
  return all.filter(r => r.teacher_id === teacherId);
}
