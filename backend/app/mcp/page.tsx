'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Wrench, Download, Star, ExternalLink, Search } from 'lucide-react';
export default function MCPPage() {
  const r = useRouter(); const [tools, setTools] = useState<any[]>([]); const [q, setQ] = useState('');
  useEffect(()=>{fetch('/api/mcp-marketplace').then(r=>r.json()).then(d=>setTools(d.tools||[])).catch(()=>{})},[]);
  const filtered = q ? tools.filter(t => t.name.toLowerCase().includes(q.toLowerCase())||t.description.toLowerCase().includes(q.toLowerCase())) : tools;
  return(<div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>🔌 MCP Маркетплейс</h2></div>
    <div style={{flex:1,overflow:'auto',padding:12}}>
      <input className="input" placeholder="Поиск инструментов..." value={q} onChange={e=>setQ(e.target.value)} style={{marginBottom:12}}/>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(t=>(<div key={t.id} className="card"><div className="card-body" style={{padding:'10px 12px',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'rgba(56,189,248,0.08)',display:'flex',alignItems:'center',justifyContent:'center'}}><Wrench size={18} color="#38bdf8"/></div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{t.name} <span className="muted" style={{fontWeight:400,fontSize:10}}>v{t.version}</span></div>
          <div className="muted" style={{fontSize:11}}>{t.description}</div>
          <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>{t.tags?.map((tag:string)=>(<span key={tag} style={{fontSize:9,padding:'1px 5px',background:'var(--accent-dim)',color:'var(--accent)',borderRadius:3}}>{tag}</span>))}</div></div>
          <div style={{textAlign:'right',fontSize:10,color:'#52525b'}}><div className="flex items-center gap-1" style={{justifyContent:'flex-end'}}><Star size={10} color="#eab308"/>{t.rating}</div><div>{t.downloads.toLocaleString()} загрузок</div>{t.free&&<span style={{color:'#22c55e'}}>✅ Бесплатно</span>}</div>
          <button className="btn btn-sm" onClick={()=>window.open(t.url,'_blank')}><ExternalLink size={12}/></button>
        </div></div>))}
      </div>
    </div>
  </div>);
}
