/**
 * 🔌 Webhook Manager
 * Отправка событий во внешние системы
 */

export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  enabled: boolean;
}

export class WebhookManager {
  private hooks = new Map<string, WebhookConfig>();

  register(config: WebhookConfig): void {
    this.hooks.set(config.id, config);
  }

  unregister(id: string): void {
    this.hooks.delete(id);
  }

  async dispatch(event: string, data: any): Promise<void> {
    const relevant = [...this.hooks.values()].filter(
      h => h.enabled && (h.events.includes('*') || h.events.includes(event))
    );

    await Promise.allSettled(relevant.map(hook => 
      fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': hook.secret ? createSignature(data, hook.secret) : '',
        },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {})
    ));
  }

  list(): WebhookConfig[] {
    return [...this.hooks.values()];
  }
}

function createSignature(payload: any, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

declare global { var __webhooks: WebhookManager | undefined; }
export function getWebhookManager(): WebhookManager {
  if (!globalThis.__webhooks) globalThis.__webhooks = new WebhookManager();
  return globalThis.__webhooks;
}
