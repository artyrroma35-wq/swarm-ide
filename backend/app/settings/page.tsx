'use client'; import { useRouter } from 'next/navigation'; import { ChevronLeft, Bot, Eye, Globe, Copy, Check, ExternalLink, Brain, BarChart3 } from 'lucide-react'; import { useState } from 'react';
export default function Settings(){const r=useRouter();const [copied,setCopied]=useState(false);const cp=(t:string)=>{navigator.clipboard.writeText(t);setCopied(true);setTimeout(()=>setCopied(false),2000)};
return(<div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)',maxWidth:600,margin:'0 auto',width:'100%'}}>
<div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>⚙️ Настройки</h2></div>
<div style={{flex:1,overflow:'auto',padding:16}}>
<div style={{marginBottom:24}}><div style={{fontSize:11,color:'#52525b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Модели AI</div>
<div className="card" style={{marginBottom:6}}><div className="card-body" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}><div style={{width:36,height:36,borderRadius:10,background:'rgba(56,189,248,0.08)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={16} color="#38bdf8"/></div><div><div style={{fontSize:13,fontWeight:600}}>Текстовая модель</div><div style={{fontSize:12,color:'#38bdf8'}}>Nemotron 3 Ultra Free</div><div className="muted" style={{fontSize:11}}>NVIDIA · 1M контекст · Бесплатно</div></div></div></div>
<div className="card"><div className="card-body" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}><div style={{width:36,height:36,borderRadius:10,background:'rgba(34,197,94,0.08)',display:'flex',alignItems:'center',justifyContent:'center'}}><Eye size={16} color="#22c55e"/></div><div><div style={{fontSize:13,fontWeight:600}}>Vision модель</div><div style={{fontSize:12,color:'#22c55e'}}>MiMo 2.5 Free</div><div className="muted" style={{fontSize:11}}>Xiaomi · Бесплатно</div></div></div></div></div>
<div style={{marginBottom:24}}><div style={{fontSize:11,color:'#52525b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>🧠 Память</div>
<button className="btn w-full" onClick={()=>r.push('/memory')} style={{justifyContent:'space-between',padding:'12px 14px',borderColor:'rgba(168,85,247,0.3)'}}>
<span className="flex items-center gap-2"><Brain size={16} color="#a855f7"/><span>Система памяти (6 уровней)</span></span><span style={{fontSize:11,color:'#71717a'}}>L1→L2→L3→L4→L5→L6 →</span>
</button>
<div className="card" style={{marginTop:8}}><div className="card-body" style={{padding:'10px 14px',fontSize:11,color:'#d4d4d8',lineHeight:1.5}}>
<p style={{margin:0}}>Многоуровневая память с автоконсолидацией:</p>
<ul style={{margin:'4px 0 0',paddingLeft:16}}>
<li>L1 — Working Memory (полная точность)</li>
<li>L2 — Short-Term (сжатые сводки)</li>
<li>L3 — Long-Term (векторный поиск)</li>
<li>L4 — Episodic (события и решения)</li>
<li>L5 — Semantic (факты и знания)</li>
<li>L6 — User Profile (предпочтения)</li>
</ul>
</div></div></div>
<div style={{marginBottom:24}}><div style={{fontSize:11,color:'#52525b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>API Ключ</div>
<div className="card"><div className="card-body" style={{padding:'12px 14px'}}><p style={{margin:'0 0 8px',fontSize:13,color:'var(--text2)'}}>Получите бесплатный ключ на opencode.ai/auth</p>
<button className="btn w-full" onClick={()=>window.open('https://opencode.ai/auth','_blank')} style={{justifyContent:'center',gap:8}}><ExternalLink size={14}/>opencode.ai/auth</button></div></div></div>
<div className="text-center" style={{padding:'24px 0',color:'#52525b',fontSize:12}}><p style={{margin:0}}>Swarm IDE v2.1 · 48 файлов</p><p style={{margin:'4px 0 0'}}>Полностью на русском · 🧠 6-уровневая память</p></div></div></div>)}
