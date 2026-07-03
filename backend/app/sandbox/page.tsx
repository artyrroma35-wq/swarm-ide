'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Terminal, Play, Trash2, RefreshCw, Cpu } from 'lucide-react';
export default function SandboxPage() {
  const r = useRouter(); const [cmd, setCmd] = useState(''); const [output, setOutput] = useState(''); const [loading, setLoading] = useState(false); const [stats, setStats] = useState<any>(null);
  async function exec(sudo = false) { if (!cmd.trim()) return; setLoading(true); setOutput(p => p + `\n$ ${sudo?'sudo ':''}${cmd}\n`); try { const res = await fetch('/api/sandbox',{method:'POST',body:JSON.stringify({action:'exec',command:cmd,sudo})}); const d = await res.json(); setOutput(p => p + (d.output||d.stdout||'') + '\n'); if (d.error) setOutput(p => p + `Error: ${d.error}\n`); } catch(e:any){setOutput(p=>p+`Error: ${e.message}\n`)} setLoading(false); setCmd(''); }
  async function loadStats() { const r = await fetch('/api/sandbox',{method:'POST',body:JSON.stringify({action:'stats'})}); setStats(await r.json()); }
  return(<div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>🏴‍☠️ Песочница (root)</h2><button className="btn btn-sm" onClick={loadStats}><Cpu size={14}/></button><button className="btn btn-sm btn-danger" onClick={async()=>{await fetch('/api/sandbox',{method:'POST',body:JSON.stringify({action:'clean'})});setOutput('[cleaned]\n')}}><Trash2 size={14}/></button></div>
    <div style={{flex:1,display:'flex',flexDirection:'column',padding:8}}>
      <div style={{flex:1,background:'#0a0a0a',border:'1px solid #27272a',borderRadius:10,padding:10,fontFamily:'monospace',fontSize:12,color:'#bbf7d0',overflow:'auto',whiteSpace:'pre-wrap',marginBottom:8}}>
        {output||'root@swarm-ide:~# Готов к работе. Введи команду.'}
        {loading&&<span className="spin">█</span>}
      </div>
      {stats&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:8}}>
        <div className="card"><div className="card-body" style={{padding:'4px 8px',fontSize:10}}><div className="muted">Диск</div><b>{stats.diskUsage}</b></div></div>
        <div className="card"><div className="card-body" style={{padding:'4px 8px',fontSize:10}}><div className="muted">Пакеты</div><b>{stats.installedPackages?.length||0}</b></div></div>
      </div>}
      <div style={{display:'flex',gap:4}}>
        <input className="input" placeholder="root@swarm-ide:~# " value={cmd} onChange={e=>setCmd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&exec()} style={{fontFamily:'monospace',fontSize:14,flex:1}}/>
        <button className="btn btn-sm" onClick={()=>exec()} disabled={loading}><Play size={14}/></button>
        <button className="btn btn-sm" onClick={()=>exec(true)} disabled={loading} style={{color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}}>sudo</button>
      </div>
    </div>
  </div>);
}
