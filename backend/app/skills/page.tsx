'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Brain } from 'lucide-react';

export default function SkillsPage() {
  const r = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  useEffect(()=>{fetch('/api/skills').then(r=>r.json()).then(d=>setSkills(d.skills||[])).catch(()=>{})},[]);
  return <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>📚 Skills — навыки</h2></div>
    <div style={{flex:1,overflow:'auto',padding:12}}>
      <div style={{fontSize:12,color:'#a1a1aa',marginBottom:12}}>Навыки загружаются в промпт агента автоматически (auto-load).</div>
      {skills.map(s=><div key={s.name} className="card" style={{marginBottom:6}}><div className="card-body" style={{padding:'10px 12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:'rgba(168,85,247,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><Brain size={16} color="#a855f7"/></div>
          <div><div style={{fontWeight:700,fontSize:13}}>{s.name}</div><div className="muted" style={{fontSize:11}}>{s.description}</div></div>
          {s.autoLoad && <span style={{fontSize:10,color:'#22c55e',background:'rgba(34,197,94,0.1)',padding:'2px 6px',borderRadius:4,marginLeft:'auto'}}>auto-load</span>}
        </div>
      </div></div>)}
    </div></div>;
}
