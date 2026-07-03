'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot, Send, Plus, Users, Network, ChevronLeft, ChevronRight, MessageSquare,
  Search, Home, Settings, Trash2, Loader2, Sparkles, Code2, Eye, Terminal,
  Globe, Download, Edit3, FileText, StopCircle, Sun, Moon, Upload, Image,
  X, Check, PanelRight, PanelRightClose, Bug, BarChart3, Languages,
  FilePenLine, Wrench, List, RefreshCw, UserPlus, FolderOpen, AlertTriangle
} from 'lucide-react';

type UUID=string;
interface Agent{id:UUID;role:string;parentId:UUID|null;status:string;createdAt:string}
interface Group{id:UUID;name:string|null;memberIds:UUID[];unreadCount:number;lastMessage?:{content:string;senderId:string;sendTime:string};updatedAt:string;createdAt:string}
interface Message{id:UUID;senderId:UUID;content:string;contentType:string;reasoningContent?:string;toolCalls?:string;toolResults?:string;sendTime:string}
interface Workspace{id:UUID;name:string;settings:string}
interface Template{name:string;role:string;icon:string;description:string;guidance:string}
interface SSEEvent{event:string;data:any;time:number}

function api<T>(path:string,init?:RequestInit):Promise<T>{return fetch(path,{...init,headers:{...init?.headers??{},'Content-Type':'application/json'}}).then(async r=>{if(!r.ok)throw new Error(`${r.status} ${await r.text().catch(()=>'')}`);return r.json() as Promise<T>})}
function fmtTime(iso:string){const d=new Date(iso);const n=new Date();const diff=n.getTime()-d.getTime();if(diff<6e4)return'только что';if(diff<36e5)return`${Math.floor(diff/6e4)} мин. назад`;if(diff<864e5)return`${Math.floor(diff/36e5)} ч. назад`;return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}
function fmtFull(iso:string){return new Date(iso).toLocaleString('ru-RU',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'long'})}
function genId(){return crypto.randomUUID()}

export default function IMPage(){return<Suspense fallback={<div className="flex items-center justify-center" style={{height:'100dvh'}}><Loader2 size={32} className="spin" color="#38bdf8"/></div>}><IMContent/></Suspense>}

function IMContent(){
  const searchParams=useSearchParams();
  const isMobileParam=searchParams.get('mobile')==='1';
  const [isMobile,setIsMobile]=useState(false);
  const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [groups,setGroups]=useState<Group[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [activeGroupId,setActiveGroupId]=useState<string|null>(null);
  const [draft,setDraft]=useState('');
  const [sending,setSending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [humanAgentId,setHumanAgentId]=useState<string|null>(null);
  const [templates,setTemplates]=useState<Template[]>([]);
  const [showTemplates,setShowTemplates]=useState(false);

  // Agent details
  const [showAgentPanel,setShowAgentPanel]=useState(false);
  const [activeStreamAgent,setActiveStreamAgent]=useState<string|null>(null);
  const [streamReasoning,setStreamReasoning]=useState('');
  const [streamContent,setStreamContent]=useState('');
  const [streamTools,setStreamTools]=useState<Array<{name:string;args:string;result?:string}>>([]);
  const [agentHistory,setAgentHistory]=useState<string>('');

  // Graph
  const [showGraph,setShowGraph]=useState(false);
  const [graphNodes,setGraphNodes]=useState<Array<{id:string;x:number;y:number;role:string;status:string;isHuman:boolean}>>([]);
  const [graphBeams,setGraphBeams]=useState<Array<{from:string;to:string;active:boolean}>>([]);
  const graphRef=useRef<HTMLDivElement>(null);
  const [draggingNode,setDraggingNode]=useState<string|null>(null);

  // Theme
  const [theme,setTheme]=useState<'dark'|'light'>('dark');

  // Templates
  useEffect(()=>{api<{templates:Template[]}>('/api/agent-templates').then(d=>setTemplates(d.templates)).catch(()=>{})},[]);

  // SSE
  const esRef=useRef<EventSource|null>(null);
  const agentStatusTimers=useRef<Map<string,number>>(new Map());

  useEffect(()=>{
    if(!workspace)return;
    if(esRef.current)esRef.current.close();
    const es=new EventSource(`/api/stream?workspaceId=${workspace.id}`);
    es.onmessage=(e)=>{
      try{
        const evt:SSEEvent=JSON.parse(e.data);
        handleSSEEvent(evt);
      }catch{}
    };
    es.onerror=()=>{};
    esRef.current=es;
    return()=>{es.close()};
  },[workspace?.id]);

  function handleSSEEvent(evt:SSEEvent){
    const d=evt.data;
    switch(evt.event){
      case 'agent_created':
        setAgents(prev=>[...prev,{id:d.agentId,role:d.role,parentId:null,status:'idle',createdAt:new Date().toISOString()}]);
        break;
      case 'group_created':
        setGroups(prev=>[...prev,{id:d.groupId,name:d.name,memberIds:d.memberIds,unreadCount:0,updatedAt:new Date().toISOString(),createdAt:new Date().toISOString()}]);
        break;
      case 'new_message':
        setMessages(prev=>{
          if(prev.some(m=>m.id===d.message.id))return prev;
          return[...prev,d.message].sort((a,b)=>new Date(a.sendTime).getTime()-new Date(b.sendTime).getTime());
        });
        break;
      case 'status':
        setAgents(prev=>prev.map(a=>a.id===evt.data?{...a,status:d}:a));
        updateGraphNodeStatus(evt.data,d);
        break;
      case 'reasoning':
        if(d)setStreamReasoning(prev=>prev+d);
        break;
      case 'content':
        if(d)setStreamContent(prev=>prev+d);
        break;
      case 'tool_call':
        if(d?.name)setStreamTools(prev=>[...prev,{name:d.name,args:d.arguments||'',result:''}]);
        break;
      case 'tool_result':
        if(d?.name)setStreamTools(prev=>prev.map(t=>t.name===d.name?{...t,result:d.result?.output||''}:t));
        break;
      case 'interrupted':
        setError('Агент прерван');
        break;
    }
  }

  function updateGraphNodeStatus(agentId:string,status:string){
    setGraphNodes(prev=>prev.map(n=>n.id===agentId?{...n,status}:n));
  }

  useEffect(()=>{const c=()=>setIsMobile(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);
  useEffect(()=>{initWorkspace()},[]);

  async function initWorkspace(){
    try{
      let ws:Workspace;
      const existing=await api<{workspaces:Workspace[]}>('/api/workspaces');
      if(existing.workspaces.length>0)ws=existing.workspaces[0];
      else ws=await api<Workspace>('/api/workspaces',{method:'POST',body:JSON.stringify({name:'Моя рабочая область'})});
      setWorkspace(ws);
      const agentsData=await api<{agents:Agent[]}>(`/api/agents?workspaceId=${ws.id}`);
      setAgents(agentsData.agents);
      const human=agentsData.agents.find(a=>a.role==='human');
      if(human)setHumanAgentId(human.id);
      await loadGroups(ws.id);

      // Init graph nodes
      const nodes=(agentsData.agents||[]).map((a,i)=>({
        id:a.id,x:100+Math.random()*400,y:100+Math.random()*300,
        role:a.role,status:a.status||'idle',isHuman:a.role==='human'
      }));
      setGraphNodes(nodes);
    }catch(e){setError(String(e))}
  }

  async function loadGroups(wid:UUID){
    try{const d=await api<{groups:Group[]}>(`/api/groups?workspaceId=${wid}`);setGroups(d.groups);if(d.groups.length>0&&!activeGroupId)setActiveGroupId(d.groups[0].id)}catch(e){setError(String(e))}
  }

  async function createAgentFromTemplate(tpl:Template){
    if(!workspace||!humanAgentId)return;
    try{
      const res=await api<{agentId:UUID;groupId:UUID}>('/api/agents',{method:'POST',body:JSON.stringify({workspaceId:workspace.id,creatorId:humanAgentId,role:tpl.role,guidance:tpl.guidance})});
      await loadGroups(workspace.id);
      setActiveGroupId(res.groupId);
      const agentsData=await api<{agents:Agent[]}>(`/api/agents?workspaceId=${workspace.id}`);
      setAgents(agentsData.agents);
      setGraphNodes(prev=>[...prev,{id:res.agentId,x:200+Math.random()*200,y:150+Math.random()*200,role:tpl.role,status:'idle',isHuman:false}]);
      setShowTemplates(false);
    }catch(e){setError(String(e))}
  }

  async function createCustomAgent(){
    if(!workspace||!humanAgentId)return;
    const role=prompt('Введите роль нового агента:');
    if(!role)return;
    try{
      const res=await api<{agentId:UUID;groupId:UUID}>('/api/agents',{method:'POST',body:JSON.stringify({workspaceId:workspace.id,creatorId:humanAgentId,role})});
      await loadGroups(workspace.id);
      setActiveGroupId(res.groupId);
      const agentsData=await api<{agents:Agent[]}>(`/api/agents?workspaceId=${workspace.id}`);
      setAgents(agentsData.agents);
      setGraphNodes(prev=>[...prev,{id:res.agentId,x:200+Math.random()*200,y:150+Math.random()*200,role,status:'idle',isHuman:false}]);
    }catch(e){setError(String(e))}
  }

  async function loadMessages(gid:UUID){
    try{const d=await api<{messages:Message[]}>(`/api/groups/${gid}/messages`);setMessages(d.messages);setTimeout(()=>chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:'smooth'}),50)}catch(e){setError(String(e))}
  }

  useEffect(()=>{if(activeGroupId)loadMessages(activeGroupId)},[activeGroupId]);

  async function sendMessage(){
    if(!draft.trim()||!workspace||!activeGroupId||!humanAgentId)return;
    setSending(true);const text=draft.trim();setDraft('');
    setStreamContent('');setStreamReasoning('');setStreamTools([]);

    // Add optimistic message
    const optMsg:Message={id:genId(),senderId:humanAgentId,content:text,contentType:'text',sendTime:new Date().toISOString()};
    setMessages(prev=>[...prev,optMsg]);

    try{
      await api(`/api/groups/${activeGroupId}/messages`,{method:'POST',body:JSON.stringify({content:text,senderId:humanAgentId,contentType:'text'})});
      await loadMessages(activeGroupId);

      // Beam animation
      const agentInGroup=agents.find(a=>a.role!=='human'&&groups.find(g=>g.id===activeGroupId)?.memberIds.includes(a.id));
      if(agentInGroup&&humanAgentId){
        setGraphBeams([{from:humanAgentId,to:agentInGroup.id,active:true}]);
        setTimeout(()=>setGraphBeams([]),2000);
      }
    }catch(e){setError(String(e))}finally{setSending(false)}
  }

  async function interruptAgent(){
    if(!activeStreamAgent)return;
    try{await api('/api/interrupt',{method:'POST',body:JSON.stringify({agentId:activeStreamAgent})})}catch{}
  }

  const chatRef=useRef<HTMLDivElement>(null);
  const activeGroup=useMemo(()=>groups.find(g=>g.id===activeGroupId),[groups,activeGroupId]);
  const agentRoleById=useMemo(()=>{const m=new Map<string,string>();for(const a of agents)m.set(a.id,a.role);return m},[agents]);

  // Agent details toggles
  const [showReasoning,setShowReasoning]=useState(true);
  const [showTools,setShowTools]=useState(true);
  const [showHistory,setShowHistory]=useState(false);

  // Theme toggle
  function toggleTheme(){
    const t=theme==='dark'?'light':'dark';
    setTheme(t);
    document.documentElement.classList.toggle('light',t==='light');
  }

  if(!workspace)return<div className="flex items-center justify-center" style={{height:'100dvh'}}><Loader2 size={32} className="spin" color="#38bdf8"/></div>;

  // ====== RENDER ======
  const msgList=(
    <div className="chat" ref={chatRef} id="chat-list">
      {messages.length===0&&(
        <div style={{textAlign:'center',color:'#52525b',marginTop:40,padding:20}}>
          <MessageSquare size={40} style={{margin:12,opacity:0.3}}/>
          <p style={{margin:0,fontSize:14}}>Начните разговор с агентами</p>
          <p style={{fontSize:12,marginTop:4,color:'#71717a'}}>Создайте агента из шаблона или напишите сообщение</p>
        </div>
      )}
      {messages.map((msg,i)=>{
        const isMe=msg.senderId===humanAgentId||agentRoleById.get(msg.senderId)==='human';
        const role=agentRoleById.get(msg.senderId)??'агент';
        const showMeta=i===0||messages[i-1]?.senderId!==msg.senderId;
        return(
          <div key={msg.id} className={`bubble ${isMe?'me':'other'} animate-fade-in`}>
            {!isMe&&showMeta&&<div className="bubble-meta"><span style={{fontWeight:600,color:'#38bdf8'}}>{role}</span><span style={{marginLeft:8}}>{fmtTime(msg.sendTime)}</span></div>}
            <div>{msg.content}</div>
            {msg.reasoningContent&&<div className="reasoning">🧠 {msg.reasoningContent}</div>}
            {msg.toolCalls&&<div className="tool-call">🔧 {msg.toolCalls}</div>}
          </div>
        );
      })}
      {/* Streaming content */}
      {streamContent&&(
        <div className="bubble other animate-fade-in">
          {streamReasoning&&showReasoning&&<div className="reasoning">🧠 {streamReasoning}</div>}
          <div>{streamContent}</div>
          {streamTools.length>0&&showTools&&streamTools.map((t,i)=>(
            <div key={i} className="tool-call">🔧 {t.name}({t.args.slice(0,100)}){t.result?` ✅`:``}</div>
          ))}
          <div style={{fontSize:11,color:'#71717a',marginTop:4}}><Loader2 size={10} className="spin" style={{display:'inline'}}/> печатает...</div>
        </div>
      )}
    </div>
  );

  const composer=(
    <div className="composer">
      <textarea className="input textarea" value={draft} onChange={e=>setDraft(e.target.value)}
        placeholder="Напишите сообщение..." rows={1}
        onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();sendMessage()}}}/>
      {streamContent&&(
        <button className="btn btn-danger btn-sm" onClick={interruptAgent} title="Прервать">
          <StopCircle size={16}/>
        </button>
      )}
      <button className="btn btn-primary" onClick={sendMessage} disabled={!draft.trim()||sending} style={{height:44}}>
        {sending?<Loader2 size={18} className="spin"/>:<Send size={18}/>}
      </button>
    </div>
  );

  // ====== AGENT DETAILS PANEL ======
  const agentPanel=(
    <div className="agent-detail">
      <div className="btn-group" style={{marginBottom:8}}>
        <button className={`btn btn-sm ${showGraph?'btn-primary':''}`} onClick={()=>setShowGraph(!showGraph)}>
          <Network size={14}/> Граф
        </button>
        <button className="btn btn-sm" onClick={toggleTheme}>
          {theme==='dark'?<Sun size={14}/>:<Moon size={14}/>}
        </button>
      </div>

      {showGraph&&(
        <div ref={graphRef} className="graph-canvas" style={{height:300,borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
          <svg className="graph-svg">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)"/>
              </marker>
            </defs>
            {/* Beams */}
            {graphBeams.map((b,i)=>(
              (()=>{
                const from=graphNodes.find(n=>n.id===b.from);
                const to=graphNodes.find(n=>n.id===b.to);
                if(!from||!to)return null;
                return(
                  <line key={i} x1={from.x+28} y1={from.y+28} x2={to.x+28} y2={to.y+28}
                    stroke="var(--accent)" strokeWidth={b.active?2:0.5} opacity={b.active?0.8:0.2}
                    markerEnd="url(#arrowhead)" className={b.active?'animate-beam':''}/>
                );
              })()
            ))}
            {/* Connection lines */}
            {graphNodes.filter(n=>!n.isHuman).map((n,i)=>{
              const human=graphNodes.find(h=>h.isHuman);
              if(!human)return null;
              return(
                <line key={`conn-${i}`} x1={human.x+28} y1={human.y+28} x2={n.x+28} y2={n.y+28}
                  stroke="var(--border)" strokeWidth={0.5} opacity={0.3}/>
              );
            })}
          </svg>
          {/* Nodes */}
          {graphNodes.map(node=>(
            <div key={node.id} className={`graph-node ${node.status==='thinking'?'active':''}`}
              style={{left:node.x,top:node.y}}
              onPointerDown={(e)=>{
                setDraggingNode(node.id);
                const el=e.currentTarget;
                const onMove=(ev:PointerEvent)=>{
                  const rect=graphRef.current?.getBoundingClientRect();
                  if(!rect)return;
                  setGraphNodes(prev=>prev.map(n=>n.id===node.id?{...n,x:ev.clientX-rect.left-28,y:ev.clientY-rect.top-28}:n));
                };
                const onUp=()=>{setDraggingNode(null);document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp)};
                document.addEventListener('pointermove',onMove);
                document.addEventListener('pointerup',onUp);
              }}>
              <div className="node-circle" style={{
                background:node.isHuman?'rgba(34,197,94,0.15)':'rgba(56,189,248,0.1)',
                border:`2px solid ${node.isHuman?'#22c55e':node.status==='thinking'?'#38bdf8':'#3f3f46'}`,
                boxShadow:node.status==='thinking'?'0 0 20px rgba(56,189,248,0.3)':'none'
              }}>
                {node.isHuman?<Users size={20} color="#22c55e"/>:<Bot size={20} color={node.status==='thinking'?'#38bdf8':'#a1a1aa'}/>}
                {node.status==='thinking'&&<div className="spin" style={{position:'absolute',width:48,height:48,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#38bdf8',opacity:0.6}}/>}
              </div>
              <div className="node-label" style={{color:node.isHuman?'#22c55e':'#d4d4d8'}}>{node.role}</div>
              <div className="node-status" style={{color:node.status==='thinking'?'#38bdf8':'#52525b'}}>
                {node.status==='thinking'?'💭 думает':node.status==='idle'?'💤 ожидает':'⚡ работает'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="btn-group" style={{marginBottom:8,flexWrap:'wrap',gap:4}}>
        <button className="btn btn-sm btn-primary" onClick={()=>{setShowTemplates(true)}}><UserPlus size={14}/> Создать</button>
        <button className="btn btn-sm" onClick={createCustomAgent}><Plus size={14}/> Своя роль</button>
        <button className="btn btn-sm" onClick={()=>window.location.href='/workspace'}><FolderOpen size={14}/> Файлы</button>
        <button className="btn btn-sm" onClick={()=>window.location.href='/settings'}><Settings size={14}/></button>
      </div>

      <div className="agent-detail-section">
        <div className="agent-detail-header" onClick={()=>setShowReasoning(!showReasoning)}>
          <span>🧠 Рассуждения</span><ChevronRight size={12} style={{transform:`rotate(${showReasoning?90:0}deg)`,transition:'.15s'}}/>
        </div>
        <div className={`agent-detail-body ${!showReasoning?'collapsed':''}`}>
          {streamReasoning||'Ожидание рассуждений...'}
        </div>
      </div>

      <div className="agent-detail-section">
        <div className="agent-detail-header" onClick={()=>setShowTools(!showTools)}>
          <span>🔧 Инструменты</span><ChevronRight size={12} style={{transform:`rotate(${showTools?90:0}deg)`,transition:'.15s'}}/>
        </div>
        <div className={`agent-detail-body ${!showTools?'collapsed':''}`}>
          {streamTools.length>0?streamTools.map((t,i)=>(
            <div key={i} style={{marginBottom:6,padding:6,background:'rgba(249,115,22,0.04)',borderRadius:6}}>
              <div style={{color:'#f97316',fontWeight:600}}>⚡ {t.name}</div>
              <div style={{fontSize:11,color:'#a1a1aa',marginTop:2,whiteSpace:'pre-wrap'}}>{t.args.slice(0,200)}</div>
              {t.result&&<div style={{fontSize:11,color:'#22c55e',marginTop:2}}>✅ {t.result.slice(0,150)}</div>}
            </div>
          )):'Ожидание вызовов...'}
        </div>
      </div>

      <div className="agent-detail-section">
        <div className="agent-detail-header" onClick={()=>setShowHistory(!showHistory)}>
          <span>📋 Контекст агента</span><ChevronRight size={12} style={{transform:`rotate(${showHistory?90:0}deg)`,transition:'.15s'}}/>
        </div>
        <div className={`agent-detail-body ${!showHistory?'collapsed':''}`}>
          {agentHistory||'Выберите агента для просмотра контекста'}
        </div>
      </div>

      <div style={{marginTop:8}}>
        <div style={{fontSize:11,color:'#52525b',fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em'}}>
          Агенты ({agents.filter(a=>a.role!=='human').length})
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {agents.filter(a=>a.role!=='human').map(a=>(
            <div key={a.id} className="card" style={{cursor:'pointer'}} onClick={()=>{
              setActiveStreamAgent(a.id);
              const g=groups.find(gr=>gr.memberIds.includes(a.id));
              if(g){setActiveGroupId(g.id)}
            }}>
              <div className="card-body" style={{padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:a.status==='thinking'?'#38bdf8':a.status==='idle'?'#52525b':'#22c55e',flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:600,flex:1}}>{a.role}</span>
                <span className="muted" style={{fontSize:10}}>{a.status==='thinking'?'💭':a.status==='idle'?'💤':'✅'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ====== TEMPLATES MODAL ======
  const templatesModal=showTemplates&&(
    <div className="modal-overlay" onClick={()=>setShowTemplates(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700}}>🤖 Шаблоны агентов</h3>
          <button className="btn btn-icon-sm" onClick={()=>setShowTemplates(false)}><X size={16}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {templates.map(tpl=>(
            <div key={tpl.name} className="card" style={{cursor:'pointer'}}
              onClick={()=>createAgentFromTemplate(tpl)}>
              <div className="card-body" style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {tpl.icon==='search'?<Search size={18} color="#38bdf8"/>:
                   tpl.icon==='code'?<Code2 size={18} color="#22c55e"/>:
                   tpl.icon==='edit'?<FilePenLine size={18} color="#f97316"/>:
                   tpl.icon==='chart'?<BarChart3 size={18} color="#a855f7"/>:
                   tpl.icon==='image'?<Image size={18} color="#eab308"/>:
                   tpl.icon==='bug'?<Bug size={18} color="#ef4444"/>:
                   <Bot size={18} color="#38bdf8"/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{tpl.name}</div>
                  <div className="muted" style={{fontSize:12,marginTop:2}}>{tpl.description}</div>
                </div>
                <Plus size={16} color="#52525b"/>
              </div>
            </div>
          ))}
          <button className="btn w-full" style={{justifyContent:'center',marginTop:4}} onClick={()=>{setShowTemplates(false);createCustomAgent()}}>
            <Plus size={14}/> Создать свою роль
          </button>
        </div>
      </div>
    </div>
  );

  // ====== MOBILE ======
  if(isMobile||isMobileParam){
    const [tab,setTab]=useState<'chats'|'agents'|'graph'>('chats');
    return(
      <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>
        <div className="panel-header" style={{height:48}}>
          {tab!=='chats'?<button className="btn btn-icon-sm" onClick={()=>setTab('chats')} style={{border:'none'}}><ChevronLeft size={20}/></button>:<Bot size={18} color="#38bdf8"/>}
          <h2>{tab==='chats'?(activeGroup?.name||'Чат'):tab==='agents'?'Агенты':'Граф'}</h2>
          <div style={{flex:1}}/>
          {tab==='chats'&&<button className="btn btn-icon-sm" onClick={()=>{setShowAgentPanel(!showAgentPanel);setShowGraph(!showGraph)}} style={{border:'none'}}><Sparkles size={18}/></button>}
        </div>

        {tab==='chats'&&<div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>{msgList}{error&&<div className="toast">{error}</div>}{composer}</div>}
        {tab==='agents'&&<div style={{flex:1,overflow:'auto',padding:12}}>
          <button className="btn btn-primary w-full" onClick={()=>setShowTemplates(true)} style={{justifyContent:'center',padding:14,marginBottom:12}}>
            <UserPlus size={18}/> Создать агента
          </button>
          {agents.filter(a=>a.role!=='human').map(a=>(
            <div key={a.id} className="card" style={{cursor:'pointer',marginBottom:6}}
              onClick={()=>{const g=groups.find(gr=>gr.memberIds.includes(a.id));if(g){setActiveGroupId(g.id);setTab('chats')}}}>
              <div className="card-body" style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:a.status==='thinking'?'#38bdf8':'#52525b',flexShrink:0}}/>
                <div style={{width:36,height:36,borderRadius:10,background:'#0b1220',border:'1px solid rgba(56,189,248,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Bot size={18} color="#38bdf8"/>
                </div>
                <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{a.role}</div><div className="muted" style={{fontSize:11,marginTop:2}}>{a.status==='thinking'?'💭 думает':'💤 ожидает'}</div></div>
                <ChevronRight size={16} color="#52525b"/>
              </div>
            </div>
          ))}
        </div>}
        {tab==='graph'&&<div style={{flex:1,overflow:'hidden',padding:12}}>
          <div ref={graphRef} className="graph-canvas" style={{height:'100%',borderRadius:12,border:'1px solid var(--border)'}}>
            <svg className="graph-svg">
              {graphNodes.filter(n=>!n.isHuman).map((n,i)=>{
                const h=graphNodes.find(x=>x.isHuman);if(!h)return null;
                return<line key={i} x1={h.x+28} y1={h.y+28} x2={n.x+28} y2={n.y+28} stroke="var(--border)" strokeWidth={0.5} opacity={0.3}/>;
              })}
            </svg>
            {graphNodes.map(n=>(
              <div key={n.id} className="graph-node" style={{left:n.x,top:n.y}}>
                <div className="node-circle" style={{width:44,height:44,background:n.isHuman?'rgba(34,197,94,0.15)':'rgba(56,189,248,0.1)',border:`2px solid ${n.isHuman?'#22c55e':'#3f3f46'}`}}>
                  {n.isHuman?<Users size={16} color="#22c55e"/>:<Bot size={16} color="#a1a1aa"/>}
                </div>
                <div className="node-label" style={{fontSize:10}}>{n.role}</div>
              </div>
            ))}
          </div>
        </div>}

        <div className="flex items-center justify-around" style={{padding:'4px 0',borderTop:'1px solid var(--border)',background:'var(--bg2)',flexShrink:0,height:50,paddingBottom:'max(4px,env(safe-area-inset-bottom))'}}>
          {[{id:'chats',label:'Чат',icon:MessageSquare},{id:'agents',label:'Агенты',icon:Bot},{id:'graph',label:'Граф',icon:Network}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id as "chats" | "agents" | "graph")}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,padding:'4px 16px',border:'none',background:'transparent',color:tab===t.id?'var(--accent)':'var(--text4)',cursor:'pointer',fontSize:9}}>
              <t.icon size={18}/><span>{t.label}</span>
            </button>
          ))}
          <button onClick={toggleTheme} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,padding:'4px 16px',border:'none',background:'transparent',color:'var(--text4)',cursor:'pointer',fontSize:9}}>
            {theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}<span>Тема</span>
          </button>
        </div>
        {templatesModal}
      </div>
    );
  }

  // ====== DESKTOP ======
  return(
    <div className="app-layout">
      {/* Left panel */}
      <div className="panel panel-left">
        <div className="panel-header">
          <div className="flex items-center gap-2"><Bot size={18} color="#38bdf8"/><h2>{workspace.name}</h2></div>
          <button className="btn btn-icon-sm" onClick={toggleTheme} style={{border:'none'}}>
            {theme==='dark'?<Sun size={14}/>:<Moon size={14}/>}
          </button>
        </div>
        <div className="panel-body">
          <div style={{padding:'8px 12px'}}>
            <button className="btn btn-primary w-full btn-sm" onClick={()=>setShowTemplates(true)}>
              <UserPlus size={14}/> Создать агента
            </button>
          </div>
          <div style={{fontSize:11,color:'#52525b',padding:'8px 12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>Диалоги</div>
          {groups.map(g=>(
            <button key={g.id} onClick={()=>setActiveGroupId(g.id)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'none',borderBottom:'1px solid #18181b',background:g.id===activeGroupId?'var(--accent-dim)':'transparent',color:'var(--text)',cursor:'pointer',textAlign:'left',width:'100%',boxShadow:g.id===activeGroupId?'inset 3px 0 0 var(--accent)':'none'}}>
              <div style={{width:32,height:32,borderRadius:8,background:g.name==='Основной чат'?'rgba(34,197,94,0.1)':'rgba(56,189,248,0.05)',border:`1px solid ${g.name==='Основной чат'?'rgba(34,197,94,0.3)':'rgba(56,189,248,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {g.name==='Основной чат'?<MessageSquare size={14} color="#22c55e"/>:<Bot size={14} color="#38bdf8"/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||'Без названия'}</div>
                {g.lastMessage&&<div className="muted" style={{fontSize:11,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.lastMessage.content}</div>}
              </div>
              {g.unreadCount>0&&<div className="badge">{g.unreadCount}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Center */}
      <div className="panel">
        <div className="panel-header">
          <h2>{activeGroup?.name||'Чат'}</h2>
          <div style={{flex:1}}/>
          {streamContent&&<button className="btn btn-danger btn-sm" onClick={interruptAgent}><StopCircle size={14}/> Стоп</button>}
          <button className="btn btn-icon-sm" onClick={()=>setShowAgentPanel(!showAgentPanel)} style={{border:'none'}}>
            {showAgentPanel?<PanelRightClose size={16}/>:<PanelRight size={16}/>}
          </button>
        </div>
        {msgList}
        {error&&<div className="toast">{error}
          <button className="btn btn-sm" style={{marginLeft:8}} onClick={()=>setError(null)}><X size={12}/></button>
        </div>}
        {composer}
      </div>

      {/* Right panel */}
      {showAgentPanel&&<div className="panel panel-right" style={{overflow:'auto'}}>
        <div className="panel-header"><h2>🧠 Детали</h2><button className="btn btn-icon-sm" onClick={()=>setShowAgentPanel(false)} style={{border:'none'}}><ChevronRight size={16}/></button></div>
        <div className="panel-body">{agentPanel}</div>
      </div>}

      {templatesModal}
    </div>
  );
}
