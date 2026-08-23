'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, LogIn, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

export default function UsersPage() {
  const r = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => { fetch('/api/auth').then(x => x.json()).then(d => setAuth(!!d.authenticated)).catch(() => setAuth(false)); }, []);

  async function submit() {
    if (!username.trim() || !password.trim()) { setStatus('Введите логин и пароль'); return; }
    setLoading(true); setStatus(''); setToken('');
    try {
      const d = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: mode, username, password }) }).then(x => x.json());
      if (d.token) { setToken(d.token); setStatus(`✅ Добро пожаловать, ${d.user?.username}!`); }
      else setStatus(`Ошибка: ${d.error}`);
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>👥 Пользователи</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {auth === false && (
        <div className="panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : ''}`} onClick={() => setMode('login')} style={{ flex: 1, justifyContent: 'center' }}><LogIn size={14} /> Вход</button>
            <button className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : ''}`} onClick={() => setMode('register')} style={{ flex: 1, justifyContent: 'center' }}><UserPlus size={14} /> Регистрация</button>
          </div>
          <input className="input" placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 10 }} />
          <input className="input" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 10 }} />
          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ justifyContent: 'center', padding: 10 }}>
            {loading ? <Loader2 size={16} className="spin" /> : <Users size={16} />}
            {mode === 'login' ? ' Войти' : ' Создать аккаунт'}
          </button>
        </div>
      )}
      {status && <div className="panel" style={{ padding: 10, fontSize: 13 }}>{status}</div>}
      {token && (
        <div className="panel" style={{ padding: 10, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><CheckCircle2 size={14} color="#22c55e" /> Токен сессии:</div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text-dim)' }}>{token}</div>
        </div>
      )}
    </div>
  </div>);
}
