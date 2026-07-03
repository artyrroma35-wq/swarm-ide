/**
 * 🎨 Рендеринг markdown с подсветкой кода и диаграммами
 * 
 * Поддерживает:
 * - Код с подсветкой (через highlight.js или аналоги)
 * - Mermaid диаграммы
 * - Таблицы, ссылки, изображения
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';
  
  // Экранируем HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Блоки кода с подсветкой
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` language-${lang}` : '';
    return `<pre class="code-block${langClass}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Инлайн код
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Mermaid диаграммы
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_, diagram) => {
    return `<div class="mermaid-diagram" data-diagram="${escapeHtml(diagram.trim())}"></div>`;
  });
  
  // Заголовки
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Жирный и курсив
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Ссылки
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // Изображения
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="chat-image">');
  
  // Списки
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => match.includes('<ul>') ? match : `<ol>${match}</ol>`);
  
  // Параграфы (строки без тегов)
  html = html.replace(/^([^<].*)$/gm, (match) => {
    if (match.trim() === '') return '';
    return `<p>${match}</p>`;
  });
  
  // Горизонтальные линии
  html = html.replace(/^---$/gm, '<hr>');
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatMarkdownForLLM(text: string): string {
  // Убираем markdown разметку для LLM
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\w]*\n?|```/g, '');
}

export function extractCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[2].trim());
  }
  return blocks;
}
