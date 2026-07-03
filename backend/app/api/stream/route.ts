import { eventBus } from '@/src/runtime/event-bus';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){
  const wsId=new URL(req.url).searchParams.get('workspaceId')??'';
  const stream=new ReadableStream({start(ctrl){
    ctrl.enqueue(new TextEncoder().encode(`data:${JSON.stringify({event:'connected',data:{workspaceId:wsId},time:Date.now()})}\n\n`));
    const keys=wsId?[`workspace:${wsId}`,'*']:['*'];
    const cleanups=keys.map(k=>eventBus.addSSEClient(k,ctrl));
    const ka=setInterval(()=>{try{ctrl.enqueue(new TextEncoder().encode(':ka\n\n'))}catch{clearInterval(ka)}},15000);
    req.signal.addEventListener('abort',()=>{clearInterval(ka);cleanups.forEach(c=>c())});
  }});
  return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'}});
}
