'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Image, Loader2 } from 'lucide-react';
export default function GeneratePage() {
  const r = useRouter(); const [prompt, setPrompt] = useState(''); const [image, setImage] = useState(''); const [loading, setLoading] = useState(false);
  async function generate() { if (!prompt.trim()) return; setLoading(true); setImage(''); try { const res = await fetch('/api/generate-image',{method:'POST',body:JSON.stringify({prompt,width:1024,height:1024})}); const d = await res.json(); setImage(d.url); } catch(e:any){alert(e.message)} setLoading(false); }
  return(<div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'var(--bg)'}}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={()=>r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button><h2>🎨 Генерация изображений</h2></div>
    <div style={{flex:1,overflow:'auto',padding:12,display:'flex',flexDirection:'column',gap:12}}>
      <textarea className="input textarea" placeholder="Опишите изображение..." value={prompt} onChange={e=>setPrompt(e.target.value)} style={{minHeight:100,fontSize:14}}/>
      <button className="btn btn-primary" onClick={generate} disabled={loading} style={{justifyContent:'center',padding:14}}>
        {loading?<><Loader2 size={18} className="spin"/> Генерирую...</>:<><Image size={18}/> Сгенерировать</>}
      </button>
      {image&&<div style={{borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
        <img src={image} alt={prompt} style={{width:'100%',display:'block'}}/>
      </div>}
    </div>
  </div>);
}
