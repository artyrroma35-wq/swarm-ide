export interface AnalyticsEvent {
  timestamp: string; type: string; agentId?: string; toolUsed?: string;
  tokensUsed?: number; duration?: number; success?: boolean; error?: string;
}

export class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 100000;

  track(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) this.events.shift();
  }

  getStats(timeframe: '1h' | '24h' | '7d' | 'all' = '24h') {
    const now = Date.now();
    const limits: Record<string, number> = { '1h': 3600000, '24h': 86400000, '7d': 604800000, 'all': Infinity };
    const cutoff = now - (limits[timeframe] || 86400000);
    const filtered = this.events.filter(e => new Date(e.timestamp).getTime() > cutoff);

    const toolUsage = new Map<string, number>();
    const agentActivity = new Map<string, number>();
    let totalTokens = 0, totalDuration = 0, errors = 0, successes = 0;

    for (const e of filtered) {
      if (e.toolUsed) toolUsage.set(e.toolUsed, (toolUsage.get(e.toolUsed)||0) + 1);
      if (e.agentId) agentActivity.set(e.agentId, (agentActivity.get(e.agentId)||0) + 1);
      totalTokens += e.tokensUsed || 0;
      totalDuration += e.duration || 0;
      if (e.success) successes++; else if (e.error) errors++;
    }

    return {
      total: filtered.length,
      timeframe, totalTokens, avgTokens: filtered.length ? Math.round(totalTokens/filtered.length) : 0,
      totalDuration, avgDuration: filtered.length ? Math.round(totalDuration/filtered.length) : 0,
      successRate: filtered.length ? (successes/filtered.length*100).toFixed(1)+'%' : '0%',
      errors, successes,
      topTools: [...toolUsage].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count})),
      topAgents: [...agentActivity].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count})),
    };
  }
}
export const analytics = new Analytics();
