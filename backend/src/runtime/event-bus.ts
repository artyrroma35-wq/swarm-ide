class EventBus {
  private sse = new Map<string, Set<ReadableStreamController<Uint8Array>>>();
  emit(event: string, data: unknown) {
    const msg = `data: ${JSON.stringify({ event, data, time: Date.now() })}\n\n`;
    const bytes = new TextEncoder().encode(msg);
    this.sse.forEach(clients => { clients.forEach(ctrl => { try { ctrl.enqueue(bytes); } catch { clients.delete(ctrl); } }); });
  }
  addSSEClient(key: string, ctrl: ReadableStreamController<Uint8Array>) {
    if (!this.sse.has(key)) this.sse.set(key, new Set());
    this.sse.get(key)!.add(ctrl);
    return () => this.sse.get(key)?.delete(ctrl);
  }
}
export const eventBus = new EventBus();
