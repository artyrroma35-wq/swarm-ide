/**
 * 📦 Auto-updater — проверка обновлений с GitHub
 */

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; version: string; url: string; changelog: string } | null> {
  try {
    const resp = await fetch('https://api.github.com/repos/chmod777john/swarm-ide/releases/latest', {
      headers: { 'User-Agent': 'SwarmIDE/3.0', 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    return {
      hasUpdate: data.tag_name !== 'v2.1.0',
      version: data.tag_name,
      url: data.html_url,
      changelog: data.body?.slice(0, 500) || '',
    };
  } catch {
    return null;
  }
}

export async function getVersion(): Promise<string> {
  try {
    const pkg = await import('../../package.json');
    return pkg.version || '3.0.0';
  } catch {
    return '3.0.0';
  }
}
