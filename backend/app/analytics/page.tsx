'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart3, Activity, Clock, CheckCircle, XCircle, Cpu, Zap } from 'lucide-react';
export default function AnalyticsPage() {
  const r = useRouter(); const [stats, setStats] = useState<any>(null);
  useEffect(()=>{fetch('/api/analytics').then(r=>r.json()).then(setStats).catch(()=>{})},[]);
  return(<div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>📊 Аналитика</h2></div>
    <div style={{flex:1,overflow:'auto',padding:12}}>
      {stats?<><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
        <div className="card"><div className="card-body" style={{padding:'8px 10px',textAlign:'center'}}><Activity size={16} color="#38bdf8" style={{margin:'0 auto 4px'}}/><div className="muted" style={{fontSize:10}}>Событий</div><div style={{fontSize:20,fontWeight:800,color:'#38bdf8'}}>{stats.total}</div></div></div>
        <div className="card"><div className="card-body" style={{padding:'8px 10px',textAlign:'center'}}><Zap size={16} color="#22c55e" style={{margin:'0 auto 4px'}}/><div className="muted" style={{fontSize:10}}>Токенов</div><div style={{fontSize:20,fontWeight:800,color:'#22c55e'}}>{(stats.totalTokens/1000).toFixed(1)}K</div></div></div>
        <div className="card"><div className="card-body" style={{padding:'8px 10px',textAlign:'center'}}><CheckCircle size={16} color="#22c55e" style={{margin:'0 auto 4px'}}/><div className="muted" style={{fontSize:10}}>Успех</div><div style={{fontSize:20,fontWeight:800,color:'#22c55e'}}>{stats.successRate}</div></div></div>
        <div className="card"><div className="card-body" style={{padding:'8px 10px',textAlign:'center'}}><Clock size={16} color="#f97316" style={{margin:'0 auto 4px'}}/><div className="muted" style={{fontSize:10}}>Среднее время</div><div style={{fontSize:20,fontWeight:800,color:'#f97316'}}>{stats.avgDuration}мс</div></div></div>
      </div>
      {stats.topTools?.length>0&&<div style={{marginBottom:12}}><h3 style={{fontSize:11,fontWeight:700,color:'#a1a1aa',margin:'0 0 6px',textTransform:'uppercase'}}>🔧 Инструменты</h3>
      {stats.topTools.map((t:any)=>(<div key={t.name} className="card" style={{marginBottom:4}}><div className="card-body" style={{padding:'6px 10px',display:'flex',justifyContent:'space-between',fontSize:12}}><span>{t.name}</span><span style={{color:'#38bdf8',fontWeight:700}}>{t.count}</span></div></div>))}</div>}
      </>:<div style={{textAlign:'center',padding:40,color:'#52525b'}}><BarChart3 size={40} style={{margin:'0 auto 12px',opacity:0.3}}/><p>Нет данных</p></div>}
    </div>
  </div>);
}
