import React, { useState, useEffect } from 'react';
import { getUnsyncedLogs } from '../utils/indexedDB.js';
import { pushUnsynced } from '../utils/syncManager.js';

export default function SyncIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    window.addEventListener('online', u);
    window.addEventListener('offline', u);
    const iv = setInterval(async () => {
      const logs = await getUnsyncedLogs();
      setPending(logs.length);
    }, 3000);
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u); clearInterval(iv); };
  }, []);

  async function handleSync() {
    await pushUnsynced();
    const logs = await getUnsyncedLogs();
    setPending(logs.length);
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      {pending > 0 && (
        <button onClick={handleSync} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          {pending} pending
        </button>
      )}
    </div>
  );
}
