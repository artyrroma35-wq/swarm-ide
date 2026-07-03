'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Copy, Check, GitBranch, Trees, RefreshCw } from 'lucide-react';

const spells = [
  { id:'map-reduce', name:'🔀 Map-Reduce', desc:'Разделить на N частей → обработать → объединить',
    icon:GitBranch, color:'#38bdf8',
    prompt:`Ты — Map-Reduce调度器.\n\n[MAP]\n1) Раздели задачу на N подзадач (N=4)\n2) Для каждой создай агента и отправь TASK\n\n[REDUCE]\n3) Дождись результатов\n4) Объедини в финальный ответ` },
  { id:'router-experts', name:'🔀 Router-Experts', desc:'Маршрутизировать задачу к лучшему эксперту',
    icon:GitBranch, color:'#22c55e',
    prompt:`Ты — Router.\n1) Прочитай список агентов\n2) Маршрутизируй: код→coder, дизайн→designer, анализ→analyst\n3) Если нет — создай\n4) Отправь задачу, верни результат` },
  { id:'tree-executor', name:'🌳 Tree-Executor', desc:'Рекурсивное дерево чисел',
    icon:Trees, color:'#a855f7',
    prompt:`Ты — Tree-Executor.\ndepth=2, branch=2, path="root"\n1) Загадай число (1-9)\n2) Создай 2 дочерних агентов\n3) total = my_number + sum(children)\n4) Отправь REPORT` },
  { id:'critic-loop', name:'🔄 Critic-Loop', desc:'Генерация → критика → перезапись',
    icon:RefreshCw, color:'#f97316',
    prompt:`Ты — Critic-Loop.\nROUND 1: Сгенерируй ответ\nROUND 2: Создай критика, найди проблемы\nROUND 3: Исправь\nFINAL: Верни результат` },
];

export default function SpellsPage() {
  const r = useRouter();
  const [copied, setCopied] = useState<string|null>(null);
  function cp(id:string, t:string) { navigator.clipboard.writeText(t); setCopied(id); setTimeout(()=>setCopied(null),2000); }
  return <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>🔮 Spells — паттерны оркестрации</h2></div>
    <div style={{flex:1,overflow:'auto',padding:12}}>
      <div style={{fontSize:12,color:'#a1a1aa',marginBottom:12}}>Оригинальные паттерны из официального Swarm IDE. Скопируй и отправь агенту.</div>
      {spells.map(s=><div key={s.id} className="card" style={{marginBottom:8}}><div className="card-body" style={{padding:'10px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <div style={{width:36,height:36,borderRadius:8,background:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><s.icon size={18} color={s.color}/></div>
          <div><div style={{fontWeight:700,fontSize:14}}>{s.name}</div><div className="muted" style={{fontSize:12}}>{s.desc}</div></div>
        </div>
        <div style={{background:'#0a0a0a',border:'1px solid #27272a',borderRadius:8,padding:10,fontSize:12,fontFamily:'monospace',color:'#d4d4d8',whiteSpace:'pre-wrap',marginBottom:8,maxHeight:150,overflow:'auto'}}>{s.prompt}</div>
        <button className="btn btn-sm w-full" onClick={()=>cp(s.id,s.prompt)} style={{justifyContent:'center'}}>
          {copied===s.id?<><Check size={14} color="#22c55e"/> Скопировано!</>:<><Copy size={14}/> Копировать</>}
        </button>
      </div></div>)}
    </div></div>;
}
