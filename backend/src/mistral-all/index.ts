/**
 * 🧠 MISTRAL AI — ВСЕ МОДЕЛИ В ОДНОМ МОДУЛЕ
 *
 * mistral-embed      20M TPM!  Эмбеддинги для RAG/поиска    $0.10/1M
 * codestral-embed    50K TPM   Эмбеддинги кода              $0.10/1M
 * mistral-ocr-latest 625 стр   OCR документов               $4/1000 стр
 * voxtral-mini-2602  50K TPM   Аудио → текст                $0.003/мин
 * mistral-moderation 50K TPM   Модерация                    Бесплатно
 */

import { getConfig } from '../lib/config';

// ==================== EMBEDDINGS (20M TPM!) ====================

export interface EmbeddingResult { embedding: number[]; dimension: number; }

export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/embeddings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'mistral-embed', input: [text] }),
  });
  const d = await r.json() as any;
  return { embedding: d.data?.[0]?.embedding || [], dimension: (d.data?.[0]?.embedding || []).length };
}

export async function getEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/embeddings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'mistral-embed', input: texts.slice(0, 100) }),
  });
  const d = await r.json() as any;
  return (d.data || []).map((x: any) => ({ embedding: x.embedding, dimension: x.embedding.length }));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i]; }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb)) || 0;
}

export async function semanticSearch(query: string, docs: string[], topK = 5) {
  const q = await getEmbedding(query);
  const ds = await getEmbeddings(docs);
  return ds.map((d, i) => ({ text: docs[i], score: cosineSimilarity(q.embedding, d.embedding) }))
    .sort((a, b) => b.score - a.score).slice(0, topK);
}

// ==================== CODE EMBEDDINGS ====================

export async function getCodeEmbedding(code: string): Promise<EmbeddingResult> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/embeddings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'codestral-embed', input: [code] }),
  });
  const d = await r.json() as any;
  return { embedding: d.data?.[0]?.embedding || [], dimension: (d.data?.[0]?.embedding || []).length };
}

// ==================== OCR ====================

export interface OCRResult { text: string; markdown: string; pages: Array<{ index: number; text: string; markdown: string }>; }

export async function extractDocument(fileUrl: string): Promise<OCRResult> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/ocr`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'mistral-ocr-latest', document: { type: 'document_url', document_url: fileUrl } }),
  });
  const d = await r.json() as any;
  return {
    text: d.pages?.map((p: any) => p.markdown).join('\n\n') || '',
    markdown: d.pages?.map((p: any) => p.markdown).join('\n\n') || '',
    pages: (d.pages || []).map((p: any, i: number) => ({ index: i, text: p.text || '', markdown: p.markdown || '' })),
  };
}

// ==================== AUDIO ====================

export async function transcribeAudio(audioUrl: string, lang = 'ru'): Promise<string> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/audio/transcriptions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'voxtral-mini-2602', audio: { url: audioUrl }, language: lang }),
  });
  const d = await r.json() as any;
  return d.text || '';
}

// ==================== MODERATION ====================

export async function moderateContent(text: string): Promise<{ flagged: boolean; categories: Record<string, boolean> }> {
  const c = getConfig();
  const r = await fetch(`${c.mistralEndpoint}/moderations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
    body: JSON.stringify({ model: 'mistral-moderation-2603', input: text }),
  });
  const d = await r.json() as any;
  return { flagged: d.results?.[0]?.flagged || false, categories: d.results?.[0]?.categories || {} };
}

// ==================== RAG PIPELINE ====================

export class RAGPipeline {
  private docs: Array<{ id: string; text: string; embedding: number[] }> = [];
  
  async addDocuments(ds: Array<{ id: string; text: string }>): Promise<void> {
    const embs = await getEmbeddings(ds.map(d => d.text));
    for (let i = 0; i < ds.length; i++) this.docs.push({ ...ds[i], embedding: embs[i].embedding });
  }

  async query(q: string, topK = 3) {
    const qEmb = await getEmbedding(q);
    return this.docs.map(d => ({ text: d.text, score: cosineSimilarity(qEmb.embedding, d.embedding) }))
      .sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async answer(question: string): Promise<string> {
    const relevant = await this.query(question);
    if (!relevant.length) return 'Нет документов.';
    const c = getConfig();
    const r = await fetch(`${c.mistralEndpoint}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.mistralApiKey}` },
      body: JSON.stringify({
        model: 'mistral-small-2603',
        messages: [
          { role: 'system', content: 'Ответь на вопрос на основе контекста. По-русски.' },
          { role: 'user', content: `Контекст:\n${relevant.map(x => x.text).join('\n\n')}\n\nВопрос: ${question}` },
        ],
        max_tokens: 1024,
      }),
    });
    const d = await r.json() as any;
    return d.choices?.[0]?.message?.content || '';
  }
}
