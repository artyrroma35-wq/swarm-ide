import { getRuntime } from '@/src/runtime/agent-runtime';
export async function POST(req:Request){const b=await req.json().catch(()=>null)as any;const r=getRuntime();if(b?.agentId){r.interruptAgent(b.agentId);return Response.json({interrupted:true,agentId:b.agentId})}r.interruptAll(b?.workspaceId);return Response.json({interrupted:true})}
