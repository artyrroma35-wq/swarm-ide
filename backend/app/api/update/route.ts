import { checkForUpdates, getVersion } from '@/src/lib/updater';
export async function GET() {
  const [update, version] = await Promise.all([checkForUpdates(), getVersion()]);
  return Response.json({ currentVersion: version, update });
}
