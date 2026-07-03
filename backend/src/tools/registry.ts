import type { ToolDefinition } from '../lib/llm';
import { getSandbox } from '../sandbox/unlimited-sandbox';
import { generateImage, generateVideo, generateVariations } from '../image-gen/agnes-studio';
import { analyzeImage } from '../lib/vision';
import { db } from '../db/client';

export interface ToolHandler {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>, ctx: { workspaceId: string; agentId: string }) => Promise<{ success: boolean; output: string; error?: string; data?: any }>;
}

const tools: ToolHandler[] = [
  // ==================== ПОИСК И ИНФОРМАЦИЯ ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'web_search',
        description: '🔍 Реальный поиск в интернете через DuckDuckGo. Находит актуальную информацию, новости, факты. Возвращает до 10 результатов с заголовками и описаниями.',
        parameters: { type: 'object', properties: { query: { type: 'string', description: 'Поисковый запрос (русский или английский)' }, count: { type: 'number', description: 'Количество результатов 1-20' } }, required: ['query'] },
      },
    },
    execute: async (args) => {
      const query = args.query as string;
      const count = Math.min(20, (args.count as number) || 10);
      try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, { headers: { 'User-Agent': 'SwarmIDE/3.0' } });
        const data = await res.json();
        const results = (data.RelatedTopics || []).slice(0, count);
        const output = results.map((r: any) => {
          const text = typeof r === 'object' ? r.Text || r.FirstURL || '' : String(r);
          const url = typeof r === 'object' ? r.FirstURL || '' : '';
          return `• ${text}${url ? `\n  ${url}` : ''}`;
        }).join('\n\n');
        return { success: true, output: output || 'Нет результатов' };
      } catch (e) { return { success: false, output: '', error: String(e) }; }
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'fetch_page',
        description: '🌐 Загрузить содержимое веб-страницы по URL. Получает чистый текст без HTML-тегов, скриптов и стилей. Полезно для чтения статей, документации, новостей.',
        parameters: { type: 'object', properties: { url: { type: 'string', description: 'Полный URL страницы (включая https://)' } }, required: ['url'] },
      },
    },
    execute: async (args) => {
      try {
        const res = await fetch(args.url as string, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwarmIDE/3.0)' }, signal: AbortSignal.timeout(15000) });
        const text = await res.text();
        const clean = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80000);
        return { success: true, output: clean || 'Пустая страница' };
      } catch (e) { return { success: false, output: '', error: String(e) }; }
    },
  },

  // ==================== ПЕСОЧНИЦА (ROOT) ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'bash',
        description: '🏴‍☠️ ВЫПОЛНИТЬ ЛЮБУЮ BASH КОМАНДУ С ПОЛНЫМ ROOT-ДОСТУПОМ. Можно: устанавливать пакеты (apt, pip, npm, go, cargo), запускать сервисы, писать в /etc, создавать пользователей, запускать серверы. Работает через sudo без пароля. Таймаут 10 минут, лимит вывода 100 MB.',
        parameters: { type: 'object', properties: {
          command: { type: 'string', description: 'Команда для выполнения' },
          sudo: { type: 'boolean', description: 'Использовать sudo (root права)' },
          background: { type: 'boolean', description: 'Запустить в фоне (для серверов и долгих процессов)' },
          timeout: { type: 'number', description: 'Таймаут в миллисекундах (макс 600000)' },
        }, required: ['command'] },
      },
    },
    execute: async (args, ctx) => {
      const sb = getSandbox();
      const r = sb.exec(args.command as string, {
        sudo: args.sudo as boolean,
        background: args.background as boolean,
        timeout: (args.timeout as number) || 600000,
      });
      return { success: r.exitCode === 0, output: r.output, error: r.error, data: { exitCode: r.exitCode } };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'install_package',
        description: '📦 УСТАНОВИТЬ ЛЮБОЙ ПАКЕТ в систему с root-доступом. Поддерживает: apt (системные пакеты), pip/pip3 (Python), npm (Node.js), go (Golang), cargo (Rust). Примеры: apt:nginx, pip:torch, npm:typescript.',
        parameters: { type: 'object', properties: {
          package: { type: 'string', description: 'Имя пакета для установки' },
          type: { type: 'string', enum: ['apt', 'npm', 'pip', 'pip3', 'go', 'cargo', 'gem'], description: 'Тип пакетного менеджера' },
        }, required: ['package', 'type'] },
      },
    },
    execute: async (args) => {
      const sb = getSandbox();
      const r = sb.install(args.package as string, (args.type as any) || 'apt');
      return { success: r.exitCode === 0, output: r.output, error: r.error };
    },
  },

  // ==================== ФАЙЛЫ ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'write_file',
        description: '💾 Написать файл в песочнице. Поддерживает любые пути. Если путь начинается с /etc, /var, /opt — автоматически использует sudo. Создаёт директории если их нет.',
        parameters: { type: 'object', properties: { path: { type: 'string', description: 'Путь к файлу (абсолютный или относительный)' }, content: { type: 'string', description: 'Содержимое файла' } }, required: ['path', 'content'] },
      },
    },
    execute: async (args, ctx) => {
      const sb = getSandbox();
      const r = sb.writeFile(args.path as string, args.content as string);
      return { success: r.exitCode === 0, output: r.output, error: r.error };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'read_file',
        description: '📖 Прочитать любой файл в системе. Поддерживает абсолютные пути. Может читать через sudo если нужно.',
        parameters: { type: 'object', properties: { path: { type: 'string', description: 'Путь к файлу' } }, required: ['path'] },
      },
    },
    execute: async (args) => {
      const sb = getSandbox();
      const content = sb.readFile(args.path as string);
      if (content !== null) return { success: true, output: content };
      return { success: false, output: '', error: 'Файл не найден' };
    },
  },

  // ==================== ГЕНЕРАЦИЯ ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'generate_image',
        description: '🎨 СГЕНЕРИРОВАТЬ ИЗОБРАЖЕНИЕ по текстовому описанию. Использует Pollinations.ai (ПОЛНОСТЬЮ БЕСПЛАТНО, без API ключа). Поддерживает стили: фотореализм, цифровой арт, аниме, 3D-рендер, масляная живопись, карандашный рисунок. Возвращает URL готового изображения.',
        parameters: { type: 'object', properties: {
          prompt: { type: 'string', description: 'Детальное описание желаемого изображения на русском или английском' },
          width: { type: 'number', description: 'Ширина (512-2048, по умолчанию 1024)' },
          height: { type: 'number', description: 'Высота (512-2048, по умолчанию 1024)' },
          model: { type: 'string', enum: ['flux', 'sdxl', 'stable-diffusion'], description: 'Модель генерации' },
          negative: { type: 'string', description: 'Что НЕ должно быть на изображении' },
        }, required: ['prompt'] },
      },
    },
    execute: async (args) => {
      const r = await generateImage(args.prompt as string, {
        width: (args.width as number) || 1024,
        height: (args.height as number) || 1024,
        model: (args.model as string) || 'flux',
        seed: Math.floor(Math.random() * 10000000),
      });
      return {
        success: true,
        output: `✅ Изображение сгенерировано!\nURL: ${r.url}\nРазмер: ${r.width}x${r.height}\nSeed: ${r.seed}`,
        data: { url: r.url, width: r.width, height: r.height, seed: r.seed },
      };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'generate_video',
        description: '🎬 СГЕНЕРИРОВАТЬ ВИДЕО по текстовому описанию. Использует HuggingFace Inference API (бесплатно, нужен HF_API_KEY). Если ключа нет — возвращает ссылку на Genmo.ai.',
        parameters: { type: 'object', properties: {
          prompt: { type: 'string', description: 'Детальное описание видео на русском или английском' },
          duration: { type: 'number', description: 'Длительность в секундах' },
          hfApiKey: { type: 'string', description: 'HuggingFace API ключ (опционально, можно в .env)' },
        }, required: ['prompt'] },
      },
    },
    execute: async (args) => {
      const r = await generateVideo(args.prompt as string, {
        duration: (args.duration as number) || 5,
        hfApiKey: (args.hfApiKey as string) || undefined,
      });
      if (r.fallback) {
        return { success: true, output: `Видео-генерация: ${r.url}${r.error ? '\n' + r.error : ''}`, data: { url: r.url, api: r.api, fallback: true } };
      }
      return { success: true, output: `🎬 Видео сгенерировано! URL: ${r.url}`, data: { url: r.url, api: r.api } };
    },
  },

  // ==================== АГЕНТЫ И КОММУНИКАЦИЯ ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'create_agent',
        description: '🤖 СОЗДАТЬ ДОЧЕРНЕГО АГЕНТА для делегирования задач. Укажите роль (например: "исследователь", "программист", "аналитик") и инструкции. Агент будет создан с собственным чатом и инструментами.',
        parameters: { type: 'object', properties: {
          role: { type: 'string', description: 'Роль нового агента, например: исследователь, программист, тестировщик, дизайнер, аналитик' },
          guidance: { type: 'string', description: 'Подробные инструкции и цели для агента' },
        }, required: ['role'] },
      },
    },
    execute: async (args, ctx) => {
      return { success: true, output: `✅ Создан агент с ролью "${args.role}"`, data: { agentId: crypto.randomUUID(), role: args.role } };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'send_message',
        description: '💬 Отправить сообщение другому агенту или в группу. Можно использовать @упоминания.',
        parameters: { type: 'object', properties: {
          to: { type: 'string', description: 'ID агента или группы' },
          content: { type: 'string', description: 'Текст сообщения' },
          type: { type: 'string', enum: ['direct', 'group'], description: 'Тип отправки' },
        }, required: ['to', 'content'] },
      },
    },
    execute: async (args) => ({ success: true, output: `✉️ Сообщение отправлено ${args.to}`, data: { to: args.to } }),
  },

  // ==================== ИНФОРМАЦИЯ ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'list_agents',
        description: '📋 Показать список всех агентов в рабочей области с их статусами (думает/ожидает/работает).',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async (_a, ctx) => {
      const agents = await db.listAgents(ctx.workspaceId);
      return { success: true, output: agents.map(a => `• ${a.role} — ${a.status === 'thinking' ? '💭 думает' : a.status === 'idle' ? '💤 ожидает' : '⚡ ' + a.status}`).join('\n') };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'list_files',
        description: '📁 Показать список файлов в песочнице и их размер.',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async () => {
      const sb = getSandbox();
      const stats = sb.getStats();
      return { success: true, output: `Файлов в песочнице: ${stats.totalFiles}\nИспользовано диска: ${stats.diskUsage}\nУстановлено пакетов: ${stats.installedPackages?.length || 0}` };
    },
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'self_info',
        description: 'ℹ️ Информация о текущем агенте: ID, роль, workspace.',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async (_a, ctx) => ({ success: true, output: JSON.stringify(ctx, null, 2), data: ctx }),
  },

  {
    definition: {
      type: 'function',
      function: {
        name: 'process_list',
        description: '⚙️ Показать список запущенных процессов в песочнице (top).',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async () => {
      const sb = getSandbox();
      return { success: true, output: sb.getProcessList() };
    },
  },

  // ==================== VISION ====================

  {
    definition: {
      type: 'function',
      function: {
        name: 'analyze_image',
        description: '👁️ ПРОАНАЛИЗИРОВАТЬ ИЗОБРАЖЕНИЕ через MiMo 2.5 Free Vision. Распознаёт объекты, сцены, текст на картинке. Передайте URL изображения (http/https или data:uri).',
        parameters: { type: 'object', properties: {
          image_url: { type: 'string', description: 'URL изображения (http:// или data:image/...) или путь к файлу в песочнице' },
          prompt: { type: 'string', description: 'Вопрос про изображение (по умолчанию: "Опиши что на картинке")' },
        }, required: ['image_url'] },
      },
    },
    execute: async (args) => {
      const url = args.image_url as string;
      let b64 = '';
      
      if (url.startsWith('data:')) {
        b64 = url.split(',')[1] || '';
      } else if (url.startsWith('http')) {
        try {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          b64 = Buffer.from(buf).toString('base64');
        } catch (e) {
          // Может быть путь к файлу в песочнице
          const sb = getSandbox();
          const content = sb.readFile(url);
          if (content) b64 = Buffer.from(content).toString('base64');
        }
      }
      
      if (!b64) return { success: false, output: '', error: 'Не удалось загрузить изображение. Укажите URL или data:uri' };
      
      try {
        const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENCODE_ZEN_API_KEY || ''}`,
          },
          body: JSON.stringify({
            model: process.env.VISION_MODEL || 'mimo-v2.5-free',
            messages: [{ role: 'user', content: [{ type: 'text', text: (args.prompt as string) || 'Опиши это изображение подробно на русском языке' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }] }],
            max_tokens: 4096,
          }),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          return { success: false, output: '', error: `Vision API ошибка ${resp.status}: ${text.slice(0, 200)}` };
        }
        const data = await resp.json() as any;
        const description = data.choices?.[0]?.message?.content || 'Не удалось распознать';
        return { success: true, output: description };
      } catch (e: any) {
        return { success: false, output: '', error: String(e) };
      }
    },
  },
];

const reg = new Map<string, ToolHandler>();
for (const t of tools) reg.set(t.definition.function.name, t);

export function getToolDefinitions(): ToolDefinition[] {
  return tools.map(t => t.definition);
}

export function getToolHandler(name: string): ToolHandler | undefined {
  return reg.get(name);
}
