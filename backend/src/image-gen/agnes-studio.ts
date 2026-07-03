/**
 * 🎨 Agnes AI — ИЗОБРАЖЕНИЯ + ВИДЕО
 * 
 * Проверено: ключ sk-1Wu... 🟢 РАБОТАЕТ
 * Модели: agnes-image-2.1-flash, agnes-video-v2.0
 */

export interface ImageResult {
  url: string;
  api: string;
  width: number;
  height: number;
}

export interface VideoResult {
  url: string;
  api: string;
  videoId?: string;
  taskId?: string;
  fallback: boolean;
  error?: string;
}

const AGNES = 'https://apihub.agnes-ai.com/v1';

function getKey(): string {
  return process.env.AGNES_API_KEY || '';
}

/**
 * 🖼️ ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЯ
 */
export async function generateImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    model?: string;
  } = {}
): Promise<ImageResult> {
  const key = getKey();
  const width = options.width || 1024;
  const height = options.height || 1024;

  // Agnes AI
  if (key) {
    try {
      const resp = await fetch(`${AGNES}/images/generations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'agnes-image-2.1-flash',
          prompt,
          size: `${width}x${height}`,
          n: 1,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (resp.ok) {
        const data = await resp.json() as any;
        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json || '';
        if (url) return { url, api: 'agnes-ai', width, height };
      }
    } catch (e) { console.warn('[Agnes] Image error:', e); }
  }

  // Fallback
  return {
    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`,
    api: 'pollinations', width, height,
  };
}

/**
 * 🎬 ГЕНЕРАЦИЯ ВИДЕО
 */
export async function generateVideo(
  prompt: string,
  options: {
    duration?: number;
    width?: number;
    height?: number;
    numFrames?: number;
    frameRate?: number;
  } = {}
): Promise<VideoResult> {
  const key = getKey();
  const width = options.width || 1152;
  const height = options.height || 768;
  const numFrames = options.numFrames || 81;
  const frameRate = options.frameRate || 24;

  // Agnes AI
  if (key) {
    try {
      // Создаём задачу
      const resp = await fetch(`${AGNES}/videos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'agnes-video-v2.0',
          prompt,
          width, height,
          num_frames: numFrames,
          frame_rate: frameRate,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (resp.ok) {
        const task = await resp.json() as any;
        const videoId = task.video_id || task.id;
        const taskId = task.task_id;

        // Если сразу есть URL
        if (task.url || task.output?.url) {
          return { url: task.url || task.output.url, api: 'agnes-ai', videoId, taskId, fallback: false };
        }

        // Пробуем получить результат
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const pollResp = await fetch(`${AGNES}/agnesapi?video_id=${videoId}`, {
              headers: { 'Authorization': `Bearer ${key}` },
              signal: AbortSignal.timeout(10000),
            });
            if (pollResp.ok) {
              const result = await pollResp.json() as any;
              const url = result.remixed_from_video_id || result.url || result.output?.url || result.data?.url || '';
              if (url && url !== videoId) return { url, api: 'agnes-ai', videoId, taskId, fallback: false };
            }
          } catch {}
        }

        return { url: '', api: 'agnes-ai', videoId, taskId, fallback: true, error: 'Видео генерируется, попробуйте проверить позже через videoId' };
      }
    } catch (e: any) { console.warn('[Agnes] Video error:', e); }
  }

  // Fallback
  return { url: `https://www.genmo.ai/play?q=${encodeURIComponent(prompt)}`, api: 'genmo-ai', fallback: true };
}

/**
 * 👁️ VISION через MiMo 2.5 Free
 */
export async function analyzeImageVision(
  imageBase64: string,
  prompt: string = 'Опиши это изображение на русском'
): Promise<string> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY || '';
  try {
    const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({
        model: 'mimo-v2.5-free',
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }] }],
        max_tokens: 1024,
      }),
    });
    if (!resp.ok) throw new Error(`MiMo: ${resp.status}`);
    const data = await resp.json() as any;
    return data.choices?.[0]?.message?.content || 'Не удалось распознать';
  } catch (e: any) { throw new Error(`Vision: ${e.message}`); }
}
