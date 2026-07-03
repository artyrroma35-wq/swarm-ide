'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, File, FileText, Code, Upload, ChevronLeft, ChevronRight, Home, Trash2 } from 'lucide-react';

export default function Workspace() {
  const r = useRouter();
  const [files, setFiles] = useState<Array<{id:string;name:string;mimeType:string;size:number}>>([]);

  function addFiles(fl: FileList) {
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      setFiles(prev => [...prev, {id: crypto.randomUUID(), name: f.name, mimeType: f.type, size: f.size}]);
    }
  }

  return (
    <div style={{height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)'}}>
      <div className="panel-header">
        <button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{border:'none'}}><ChevronLeft size={18}/></button>
        <h2>📁 Рабочая область</h2>
        <div style={{flex:1}}/>
        <button className="btn btn-sm" onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.onchange = () => { if (i.files) addFiles(i.files); }; i.click(); }}>
          <Upload size={14}/> Загрузить
        </button>
      </div>
      <div style={{padding:'8px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text3)'}}>
        <Home size={14}/><ChevronRight size={12}/><span style={{color:'var(--text)', fontWeight:600}}>workspace</span>
      </div>
      <div style={{flex:1, overflow:'auto', padding:12}}>
        {files.length === 0 ? (
          <div style={{textAlign:'center', color:'#52525b', marginTop:60}}>
            <Folder size={48} style={{marginBottom:16, opacity:0.2}}/>
            <p style={{margin:0, fontSize:15}}>Рабочая область пуста</p>
            <p style={{fontSize:13, marginTop:6, color:'#71717a'}}>Загрузите файлы или создайте через агентов</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:4}}>
            {files.map(f => (
              <div key={f.id} className="card">
                <div className="card-body" style={{padding:'10px 14px', display:'flex', alignItems:'center', gap:10}}>
                  <FileText size={16} color="#a855f7"/>
                  <span style={{fontSize:13, fontWeight:500, flex:1}}>{f.name}</span>
                  <span className="muted" style={{fontSize:11}}>{(f.size/1024).toFixed(1)} KB</span>
                  <button className="btn btn-icon-sm" style={{border:'none'}} onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}>
                    <Trash2 size={12} color="#ef4444"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{borderTop:'1px solid var(--border)', padding:'10px 14px', fontSize:11, color:'#52525b', textAlign:'center'}}>
        Инструменты: read_file · write_file · edit_file · bash · run_code
      </div>
    </div>
  );
}
