import { useState } from 'react';
import { Fingerprint, ShieldCheck, Trash2 } from 'lucide-react';

const KEY_PREFIX = 'finance_device_lock_v1:';
function keyFor(email: string) {
  return KEY_PREFIX + String(email || '').trim().toLowerCase();
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const data = new Uint8Array(bytes);
  let binary = '';
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function recordFor(email: string) {
  try {
    const raw = localStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasDeviceLock(email: string) {
  return !!recordFor(email)?.credentialId;
}

export async function registerDeviceLock(email: string) {
  if (!window.isSecureContext || !navigator.credentials || !window.PublicKeyCredential) {
    throw new Error('دا براوزر د موبایل fingerprint/PIN WebAuthn نه ملاتړ کوي.');
  }
  const userId = new TextEncoder().encode(String(email));
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'د مالي مدیریت سیستم' },
      user: { id: userId, name: String(email), displayName: String(email) },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
    },
  });
  if (!(credential instanceof PublicKeyCredential)) throw new Error('د وسیلې د امنیت جوړول ناکام شول.');
  localStorage.setItem(keyFor(email), JSON.stringify({
    credentialId: bytesToBase64Url(credential.rawId),
    createdAt: new Date().toISOString(),
  }));
}

async function unlockDeviceLock(email: string) {
  const record = recordFor(email);
  if (!record?.credentialId) return;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: 'public-key', id: base64UrlToBytes(record.credentialId) }],
      userVerification: 'required',
      timeout: 60_000,
    },
  });
  if (!credential) throw new Error('د وسیلې تصدیق بشپړ نه شو.');
}

export function DeviceGate({ email, isAdmin, onUnlocked, onSignOut }: {
  email: string;
  isAdmin: boolean;
  onUnlocked: () => void;
  onSignOut: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = hasDeviceLock(email);

  const setup = async () => {
    setBusy(true);
    setMessage('');
    try {
      await registerDeviceLock(email);
      setMessage('د موبایل fingerprint/PIN امنیت فعال شو.');
      onUnlocked();
    } catch (e: any) {
      setMessage(e?.message || 'د وسیلې امنیت فعال نه شو.');
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    setBusy(true);
    setMessage('');
    try {
      await unlockDeviceLock(email);
      onUnlocked();
    } catch (e: any) {
      setMessage(e?.message || 'د وسیلې تصدیق ناکام شو.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="device-gate">
      <div className="device-gate-card">
        <ShieldCheck size={42} />
        <h1>{isAdmin ? 'د مدیر وسیله تصدیق' : 'د وسیلې خوندي ننوتل'}</h1>
        <p>{email}</p>
        <small>{isAdmin && !locked ? 'د مدیر لپاره د موبایل fingerprint/PIN فعالول لازمي دي.' : 'د همدې موبایل fingerprint یا PIN سره ننوتل تأیید کړئ.'}</small>
        {locked ? (
          <button className="primary big" onClick={unlock} disabled={busy}>
            <Fingerprint size={20} />
            {busy ? 'تصدیق کېږي...' : 'Fingerprint / د موبایل PIN'}
          </button>
        ) : (
          <button className="primary big" onClick={setup} disabled={busy}>
            <Fingerprint size={20} />
            {busy ? 'فعالیږي...' : 'Fingerprint / د موبایل PIN فعالول'}
          </button>
        )}
        <button className="ghost big" onClick={onSignOut}>بېرته وتل</button>
        {message && <div className="notice warn">{message}</div>}
      </div>
    </div>
  );
}

export function DeviceSecurityCard({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const [locked, setLocked] = useState(() => hasDeviceLock(email));
  const [message, setMessage] = useState('');
  const setup = async () => {
    setMessage('');
    try {
      await registerDeviceLock(email);
      setLocked(true);
      setMessage('د دې حساب لپاره د وسیلې fingerprint/PIN فعال شو.');
    } catch (e: any) {
      setMessage(e?.message || 'د وسیلې امنیت فعال نه شو.');
    }
  };
  const remove = () => {
    if (isAdmin) return;
    localStorage.removeItem(keyFor(email));
    setLocked(false);
    setMessage('د وسیلې قفل لرې شو.');
  };
  return (
    <div className="settings-section device-security-card">
      <div className="settings-section-head">
        <div>
          <h3><ShieldCheck size={18} /> د موبایل امنیت</h3>
          <p>{isAdmin ? 'د مدیر حساب لپاره fingerprint/PIN باید فعال پاتې شي.' : 'هر کاروونکی کولی شي خپل حساب د همدې موبایل د fingerprint/PIN له لارې قفل کړي.'}</p>
        </div>
      </div>
      <div className="device-security-status">
        <span>{locked ? 'فعال' : 'غیر فعال'}</span>
        {!locked && <button className="primary" onClick={setup}><Fingerprint size={17} /> فعالول</button>}
        {locked && !isAdmin && <button className="danger-btn" onClick={remove}><Trash2 size={17} /> قفل لرې کول</button>}
      </div>
      {isAdmin && locked && <div className="notice ok">د مدیر قفل د حساب له تنظیماتو څخه نه شي بندېدای.</div>}
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
