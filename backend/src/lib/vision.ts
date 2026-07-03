import { getConfig } from './config';
export async function analyzeImage(b64: string, prompt = 'Опиши изображение на русском') {
  const c = getConfig();
  try { const r = await fetch(`${c.opencodeZenBaseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(c.opencodeZenApiKey ? { Authorization: `Bearer ${c.opencodeZenApiKey}` } : {}) }, body: JSON.stringify({ model: c.visionModel, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }] }], max_tokens: 4096 }) }); if (!r.ok) return { description: '', error: `Vision ошибка: ${r.status}` }; const d = await r.json() as any; return { description: d.choices?.[0]?.message?.content ?? '' }; } catch (e) { return { description: '', error: String(e) }; }
}
