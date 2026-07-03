export async function searchWeb(query: string, count = 10): Promise<string> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, { headers: { 'User-Agent': 'SwarmIDE/3.0' } });
    const data = await res.json();
    const results = (data.RelatedTopics||[]).slice(0, count);
    return results.map((r: any) => {
      const text = typeof r === 'object' ? r.Text||r.FirstURL||'' : String(r);
      const url = typeof r === 'object' ? r.FirstURL||'' : '';
      return `• ${text}${url ? `\n  ${url}` : ''}`;
    }).join('\n\n') || 'Нет результатов';
  } catch (e) { return `Ошибка поиска: ${e}`; }
}

export async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwarmIDE/3.0)' }, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi,'').replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi,'').replace(/<header[^>]*>[\s\S]*?<\/header>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,80000);
  } catch (e) { return `Ошибка загрузки: ${e}`; }
}
