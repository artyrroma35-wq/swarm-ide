'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Activity, Users, MessageSquare, Bot, Cpu, HardDrive, Zap, TrendingUp, Globe } from 'lucide-react';

export default function Dashboard() {
  const r = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then(r => r.json()).catch(() => null),
      fetch('/api/analytics').then(r => r.json()).catch(() => null),
      fetch('/api/memory').then(r => r.json()).catch(() => null),
    ]).then(([health, analytics, memory]) => {
      setStats({ health, analytics, memory: memory?.stats });
    });
  }, []);

  const cards = [
    { label: 'Статус', value: stats?.health?.status || '...', icon: Activity, color: '#22c55e' },
    { label: 'Модель', value: stats?.health?.models?.text || '...', icon: Bot, color: '#38bdf8' },
    { label: 'Событий', value: stats?.analytics?.total?.toString() || '0', icon: Zap, color: '#f97316' },
    { label: 'Токенов', value: stats?.memory?.effectiveContext ? `${(stats.memory.effectiveContext/1e9).toFixed(1)}B` : '0', icon: TrendingUp, color: '#a855f7' },
  ];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="panel-header">
        <button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18}/></button>
        <h2>📊 Дашборд</h2>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
          {cards.map(c => (
            <div key={c.label} className="card">
              <div className="card-body" style={{ padding: '10px 12px', textAlign: 'center' }}>
                <c.icon size={20} color={c.color} style={{ margin: '0 auto 4px', display: 'block' }} />
                <div className="muted" style={{ fontSize: 10 }}>{c.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: 20, color: '#52525b', fontSize: 12 }}>
          <Activity size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>Дашборд обновляется в реальном времени</p>
        </div>
      </div>
    </div>
  );
}

function ChevronLeft(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>; }
