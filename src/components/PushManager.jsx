import { useEffect } from 'react';
import { subscribePush } from '../utils/api.js';

export default function PushManager({ teacherId }) {
  useEffect(() => {
    if (!teacherId) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function init() {
      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Already subscribed — keep it fresh
          return;
        }
        // For VAPID, we need applicationServerKey
        // Using the public VAPID key (set via env var or hardcoded)
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.log('[PUSH] No VAPID key configured — skipping subscription');
          return;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        });
        await subscribePush(teacherId, sub.toJSON());
        console.log('[PUSH] Subscribed');
      } catch (err) {
        console.error('[PUSH] Setup failed:', err.message);
      }
    }
    init();
  }, [teacherId]);

  return null;
}
