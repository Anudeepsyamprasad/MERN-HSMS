import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../utils/axiosConfig';
import './ServerWakeBanner.css';

// The backend runs on a free instance that sleeps after 15 minutes without
// traffic and takes up to a minute to wake. This banner pings the health
// endpoint on page load and, if the server is slow to answer, tells the
// visitor what is happening instead of leaving them with a frozen page.

const SHOW_AFTER_MS = 2500; // only show the banner if waking takes a while
const RETRY_EVERY_MS = 3000;
const GIVE_UP_AFTER_MS = 120000;

const ServerWakeBanner = () => {
  const [status, setStatus] = useState('checking'); // checking | waking | ready | failed

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    const startedAt = Date.now();

    const showTimer = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === 'checking' ? 'waking' : s));
    }, SHOW_AFTER_MS);

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
        const body = res.ok ? await res.json() : null;
        if (body && body.database === 'connected') {
          if (!cancelled) setStatus((s) => (s === 'waking' ? 'ready' : 'hidden'));
          return;
        }
      } catch (err) {
        // Server still asleep or starting; try again below
      }

      if (cancelled) return;
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        setStatus('failed');
        return;
      }
      retryTimer = setTimeout(ping, RETRY_EVERY_MS);
    };

    ping();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(retryTimer);
    };
  }, []);

  // Hide the "ready" message after a moment
  useEffect(() => {
    if (status !== 'ready') return undefined;
    const t = setTimeout(() => setStatus('hidden'), 3000);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'checking' || status === 'hidden') return null;

  const messages = {
    waking: 'Waking up the demo server… It runs on free hosting that sleeps when idle, so the first load can take up to a minute.',
    ready: 'Server is ready.',
    failed: 'The demo server is not responding. Please refresh the page in a minute.',
  };

  return (
    <div className={`server-wake-banner server-wake-banner--${status}`} role="status" aria-live="polite">
      {status === 'waking' && <span className="server-wake-spinner" aria-hidden="true" />}
      <span>{messages[status]}</span>
    </div>
  );
};

export default ServerWakeBanner;
