export async function searchWeb(query: string, count = 5): Promise<string> {
  try { const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, { headers: { 'User-Agent': 'SwarmIDE/2.1' } }); const d = await r.json(); return (d.RelatedTopics ?? []).slice(0, count).map((x: any) => `• ${typeof x === 'object' ? x.Text || x.FirstURL || '' : x}`).join('\n\n') || 'Нет результатов'; } catch (e) { return `Ошибка поиска: ${e}`; }
}
export async function fetchPage(url: string): Promise<string> {
  try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwarmIDE/2.1)' }, signal: AbortSignal.timeout(10000) }); return (await r.text()).replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,50000); } catch (e) { return `Ошибка загрузки: ${e}`; }
}
