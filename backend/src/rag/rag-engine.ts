import { getBillionContext } from '../memory/true-billion-context';

export class RAGEngine {
  private documents = new Map<string, { content: string; metadata: Record<string, any>; chunks: string[] }>();

  async addDocument(id: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    const chunks = this.chunkText(content, 1000);
    this.documents.set(id, { content, metadata, chunks });
    const bc = getBillionContext();
    for (let i = 0; i < chunks.length; i++) {
      await bc.remember(chunks[i], { workspaceId: metadata.workspaceId, importance: 0.4, type: 'rag_document' as any });
    }
  }

  async query(question: string, workspaceId?: string): Promise<string> {
    const bc = getBillionContext();
    return bc.findRelevant(question, { workspaceId, limit: 10, deep: true });
  }

  async answer(question: string, context: string): Promise<string> {
    return `[RAG ANSWER]\nВопрос: ${question}\nКонтекст найден: ${context.slice(0, 200)}...\n(В реальной системе здесь был бы ответ LLM)`;
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
    return chunks;
  }
}
export const ragEngine = new RAGEngine();
