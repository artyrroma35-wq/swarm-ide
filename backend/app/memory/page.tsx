'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Brain, Search, BarChart3, RefreshCw, Database, Star, Tags, Activity, Zap, Check, X, Target } from 'lucide-react';

export default function MemoryPage() {
  const r = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { fetchStats() }, []);

  async function fetchStats() {
    try { const r = await fetch('/api/memory', { method: 'POST', body: JSON.stringify({ action: 'stats' }) }); const d = await r.json(); setStats(d.stats); } catch(e) {}
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true); setVerifyResult(null);
    try { const r = await fetch('/api/memory', { method: 'POST', body: JSON.stringify({ action: 'search', query, limit: 20 }) }); const d = await r.json(); setResults(d.results || ''); } catch(e) {}
    setSearching(false);
  }

  async function handleVerify() {
    if (!query.trim()) return;
    setVerifying(true);
    try { const r = await fetch('/api/memory', { method: 'POST', body: JSON.stringify({ action: 'verify', query }) }); const d = await r.json(); setVerifyResult(d); } catch(e) {}
    setVerifying(false);
  }

  const reached = stats && stats.progressPercent >= 100;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="panel-header">
        <button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button>
        <h2>🧠 1 МИЛЛИАРД НЕСЖАТЫХ ТОКЕНОВ</h2>
        <button className="btn btn-sm" onClick={fetchStats}><RefreshCw size={14}/></button>
      </div>
      <div style={{flex:1, overflow:'auto', padding:12}}>
        {stats && <>
          <div style={{
            background: reached ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(56,189,248,0.05))' : 'linear-gradient(135deg,rgba(168,85,247,0.05),rgba(56,189,248,0.05))',
            border: `1px solid ${reached ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.2)'}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          }}>
            <div className="flex items-center gap-2" style={{marginBottom:4}}>
              {reached ? <Check size={16} color="#22c55e" /> : <Target size={16} color="#a855f7" />}
              <span style={{fontWeight:800, fontSize:15, color: reached ? '#22c55e' : '#a855f7'}}>
                {reached ? '✅ 1 000 000 000 НЕСЖАТЫХ ТОКЕНОВ' : `🎯 ${stats.totalTokensStored.toLocaleString()} / 1 000 000 000`}
              </span>
            </div>
            {!reached && <div style={{marginTop:4}}>
              <div style={{height:6, background:'#18181b', borderRadius:3, overflow:'hidden'}}>
                <div style={{height:'100%', width:`${stats.progressPercent}%`, background:'linear-gradient(90deg,#38bdf8,#a855f7)', borderRadius:3}}/>
              </div>
              <div style={{fontSize:11, color:'#52525b', marginTop:2}}>{stats.progressPercent.toFixed(4)}%</div>
            </div>}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6,marginBottom:12}}>
            <SC icon={Database} label="Токенов" value={(stats.totalTokensStored/1e6).toFixed(1)+'M'} sub={stats.totalChunks+' чанков'} color="#38bdf8"/>
            <SC icon={Tags} label="Термов" value={stats.uniqueTerms.toLocaleString()} sub="в индексе" color="#22c55e"/>
            <SC icon={Star} label="Сущностей" value={stats.entitiesCount.toString()} sub="распознано" color="#eab308"/>
            <SC icon={Brain} label="Поиск" value="Гибридный" sub="BM25+Semantic+RRF" color="#a855f7"/>
          </div>

          <div style={{background:'rgba(56,189,248,0.03)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:10, padding:'8px 12px', marginBottom:12, fontSize:10, color:'#a1a1aa', lineHeight:1.5}}>
            <strong style={{color:'#38bdf8'}}>🔍 КЛЮЧЕВОЕ ОТЛИЧИЕ:</strong> Это НЕ сжатие!<br/>
            • Все {stats.totalTokensStored.toLocaleString()} токенов хранятся в <strong style={{color:'#d4d4d8'}}>ИСХОДНОМ ВИДЕ</strong><br/>
            • Разбиты на {stats.totalChunks.toLocaleString()} чанков по 512 токенов<br/>
            • Инвертированный индекс: {stats.uniqueTerms.toLocaleString()} термов<br/>
            • Поиск: BM25 + Semantic Embeddings + RRF Fusion + MMR Diversity<br/>
            • Результаты загружаются ПОЛНОСТЬЮ, без какого-либо сжатия<br/>
            • Если агент спросит про архивы — найдёт и покажет в реальном времени
          </div>
        </>}

        <div style={{marginBottom:12}}>
          <div style={{display:'flex',gap:4}}>
            <input className="input" placeholder="Что найти в 1 млрд токенов?" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} style={{fontSize:13,flex:1}}/>
            <button className="btn btn-sm btn-primary" onClick={handleSearch} disabled={searching}>{searching?<RefreshCw size={14} className="spin"/>:<Search size={14}/>}</button>
            <button className="btn btn-sm" onClick={handleVerify} disabled={verifying} style={{borderColor:'rgba(168,85,247,0.3)'}}>
              {verifying?<RefreshCw size={14} className="spin"/>:<Zap size={14} color="#a855f7"/>}
            </button>
          </div>
        </div>

        {verifyResult && <div style={{padding:'8px 12px', borderRadius:8, marginBottom:8, background: verifyResult.found ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${verifyResult.found ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`}}>
          <div className="flex items-center gap-2" style={{marginBottom:4}}>
            {verifyResult.found ? <Check size={14} color="#22c55e"/> : <X size={14} color="#ef4444"/>}
            <span style={{fontWeight:700, fontSize:12, color: verifyResult.found ? '#22c55e' : '#ef4444'}}>
              {verifyResult.found ? 'НАЙДЕНО!' : 'НЕ НАЙДЕНО'}
            </span>
          </div>
          {verifyResult.found && <div style={{fontSize:10, color:'#a1a1aa'}}>Уверенность: {(verifyResult.confidence*100).toFixed(0)}%<br/>{verifyResult.evidence.slice(0,200)}</div>}
        </div>}

        {results && results.length > 20 && <div style={{background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:'8px 12px', marginBottom:8, fontSize:11, color:'#bbf7d0', whiteSpace:'pre-wrap', lineHeight:1.4, maxHeight:400, overflow:'auto'}}>{results}</div>}

        <div style={{textAlign:'center',padding:'12px 0',color:'#52525b',fontSize:9}}>
          🧠 TRUE 1 BILLION CONTEXT · Никакого сжатия! · Chunk(512,ov50) · Embed(768D) · BM25+Semantic+RRF+MMR · Deep search
        </div>
      </div>
    </div>
  );
}

function SC({icon:Icon,label,value,sub,color}:{icon:any;label:string;value:string;sub:string;color:string}){
  return <div className="card"><div className="card-body" style={{padding:'6px 8px', textAlign:'center'}}>
    <Icon size={14} color={color} style={{margin:'0 auto 2px',display:'block'}}/>
    <div className="muted" style={{fontSize:8}}>{label}</div>
    <div style={{fontSize:13,fontWeight:800,color}}>{value}</div>
    <div className="muted" style={{fontSize:8}}>{sub}</div>
  </div></div>;
}
