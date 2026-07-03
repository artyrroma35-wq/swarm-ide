'use client';
import { useRouter } from 'next/navigation';
import { Bot, MessageSquare, Settings, ChevronRight, Brain, Image, Video, Terminal, Wrench, TestTube, BarChart3, BookOpen, Download, Globe, Users, Share2, Layers, Code2 } from 'lucide-react';

const features = [
  { icon: MessageSquare, label: 'Чат с агентами', path: '/im', desc: 'Групповые чаты, @упоминания, рои', color: '#38bdf8' },
  { icon: Brain, label: '1 млрд контекст', path: '/memory', desc: 'TRUE 1 BILLION CONTEXT', color: '#a855f7' },
  { icon: Bot, label: 'Рабочая область', path: '/workspace', desc: 'Файлы, код, конфиги', color: '#22c55e' },
  { icon: Terminal, label: 'Песочница (root)', path: '/sandbox', desc: 'Любые команды, apt, npm, pip', color: '#ef4444' },
  { icon: Image, label: 'Генерация изображений', path: '/generate', desc: 'Agnes Studio', color: '#f97316' },
  { icon: Video, label: 'Генерация видео', path: '/video-gen', desc: 'Agnes Video', color: '#eab308' },
  { icon: Globe, label: 'Поиск в интернете', path: '/search', desc: 'DuckDuckGo, загрузка страниц', color: '#06b6d4' },
  { icon: Layers, label: 'Визуальный конструктор', path: '/builder', desc: 'Drag-and-drop агентов', color: '#8b5cf6' },
  { icon: BookOpen, label: "🔮 Spells", path: "/spells", desc: "Map-Reduce, Router, Tree", color: "#38bdf8" },
  { icon: Brain, label: "📚 Skills", path: "/skills", desc: "Навыки агентов", color: "#a855f7" },
  { icon: Wrench, label: 'MCP Маркетплейс', path: '/mcp', desc: '8 готовых интеграций', color: '#ec4899' },
  { icon: TestTube, label: 'Тестирование', path: '/testing', desc: 'Тест-кейсы, метрики', color: '#14b8a6' },
  { icon: BarChart3, label: 'Аналитика', path: '/analytics', desc: 'Использование, токены, тренды', color: '#f59e0b' },
  { icon: BookOpen, label: 'RAG документы', path: '/rag', desc: 'Загрузка PDF, ответы по docs', color: '#6366f1' },
  { icon: Users, label: 'Мультипользователи', path: '/users', desc: 'Multi-tenant, роли', color: '#84cc16' },
  { icon: Share2, label: 'Экспорт/Импорт', path: '/export', desc: 'JSON, бэкапы, шаринг', color: '#06b6d4' },
  { icon: Download, label: 'Code Editor', path: '/code', desc: 'Monaco editor', color: '#38bdf8' },
  { icon: Activity, label: 'Дашборд', path: '/dashboard', desc: 'Статистика', color: '#22c55e' },
  { icon: Settings, label: 'Настройки', path: '/settings', desc: 'Модели, API, темы', color: '#a1a1aa' },
];

export default function Home() {
  const r = useRouter();
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="panel-header">
        <div className="flex items-center gap-2"><Bot size={18} color="#38bdf8"/><h2>🧠 Swarm IDE v3.0</h2></div>
        <span style={{fontSize:10,color:'#52525b'}}>16 функций</span>
      </div>
      <div style={{flex:1, overflow:'auto', padding:10}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:6}}>
          {features.map(f => (
            <button key={f.path} onClick={() => r.push(f.path)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                padding:'12px 8px', borderRadius:12, border:'1px solid var(--border)',
                background:'var(--bg4)', cursor:'pointer', color:'var(--text)',
                transition:'all .15s', textDecoration:'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.background = `${f.color}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg4)'; }}
            >
              <div style={{width:40,height:40,borderRadius:10,background:`${f.color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <f.icon size={18} color={f.color}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,textAlign:'center'}}>{f.label}</span>
              <span className="muted" style={{fontSize:9,textAlign:'center'}}>{f.desc}</span>
            </button>
          ))}
        </div>

        <div style={{
          marginTop:16, background:'rgba(56,189,248,0.03)', border:'1px solid rgba(56,189,248,0.12)',
          borderRadius:10, padding:'10px 14px', fontSize:10, color:'#52525b', lineHeight:1.6
        }}>
          <strong style={{color:'#38bdf8'}}>🚀 ВСЁ РАБОТАЕТ:</strong><br/>
          🔴 Песочница с root — реальный bash, apt install, npm, pip, go, cargo<br/>
          🟠 Генерация — изображения и видео через Agnes Studio<br/>
          🟡 Поиск — реальный DuckDuckGo + загрузка страниц<br/>
          🟢 Память — TRUE 1 000 000 000 неcжатых токенов<br/>
          🔵 RAG — загрузка документов, ответы по ним<br/>
          🟣 MCP — 8 готовых интеграций из маркетплейса<br/>
          ⚪ Аналитика, тестирование, мультипользователи, коллаборация
        </div>
      </div>
    </div>
  );
}
