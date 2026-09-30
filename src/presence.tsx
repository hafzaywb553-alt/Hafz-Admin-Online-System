import { useEffect, useRef, useState } from 'react';
import { api, ws } from '@appdeploy/client';
import { UserCheck } from 'lucide-react';

type OnlineUser = { userId: string; email?: string; name?: string; lastSeen?: string };
type PresencePayload = { count: number; users: OnlineUser[]; ttlSeconds?: number };

function getSessionId() {
  const key = 'finance_presence_session_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 's-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessionStorage.setItem(key, id);
  return id;
}

export function PresenceBar({ user }: { user: any }) {
  const [presence, setPresence] = useState<PresencePayload>({ count: 0, users: [] });
  const connRef = useRef<ReturnType<typeof ws.connect> | null>(null);

  useEffect(() => {
    let mounted = true;
    const sessionId = getSessionId();
    const conn = ws.connect();
    connRef.current = conn;

    const apply = (next: PresencePayload | undefined) => {
      if (mounted && next && Array.isArray(next.users)) setPresence(next);
    };

    api.get('/api/presence').then(r => apply(r.data)).catch(() => {});
    conn.onMessage(message => {
      if (message?.type !== 'entity.update') return;
      const p = message?.payload;
      if (p?.entity_type === 'presence' && p?.entity_id === 'global') apply(p.data);
    });

    conn.ready
      .then(async () => {
        if (!mounted || !conn.connectionId) return;
        await api.post('/api/subscriptions', {
          entity_type: 'presence',
          entity_id: 'global',
          connection_id: conn.connectionId,
        });
        const first = await api.post('/api/presence/heartbeat', { sessionId });
        apply(first.data);
      })
      .catch(() => {});

    const timer = window.setInterval(() => {
      api.post('/api/presence/heartbeat', { sessionId }).then(r => apply(r.data)).catch(() => {});
    }, 15_000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      api.post('/api/presence/offline', { sessionId }).catch(() => {});
      if (conn.connectionId) {
        api.post('/api/subscriptions/remove', {
          entity_type: 'presence',
          entity_id: 'global',
          connection_id: conn.connectionId,
        }).catch(() => {});
      }
      conn.disconnect();
      connRef.current = null;
    };
  }, [user?.userId]);

  const names = presence.users.slice(0, 4).map(u => u.name || u.email || 'کاروونکی');
  const extra = Math.max(0, presence.count - names.length);

  return (
    <div className="presence-bar" title={names.join('، ')}>
      <UserCheck size={17} />
      <b>{presence.count}</b>
      <span>کسان آنلاین</span>
      {names.length > 0 && <em>{names.join('، ')}{extra ? ` +${extra}` : ''}</em>}
    </div>
  );
}
