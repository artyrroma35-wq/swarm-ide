/**
 * 🛡️ API Middleware: rate limiting + auth + validation
 */
import { apiLimiter, authLimiter } from './rate-limiter';

export function withRateLimit(req: Request, key?: string): Response | null {
  const limiterKey = key || req.headers.get('x-forwarded-for') || 'default';
  if (!apiLimiter.check(limiterKey)) {
    const retryAfter = apiLimiter.getResetTime(limiterKey);
    return new Response(JSON.stringify({ 
      error: 'rate_limit_exceeded', 
      message: 'Слишком много запросов', 
      retryAfterMs: retryAfter,
      remaining: apiLimiter.getRemaining(limiterKey)
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(retryAfter / 1000)) }
    });
  }
  return null;
}

export function withAuth(req: Request): { authenticated: boolean; userId?: string } {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) return { authenticated: false };
  try {
    const { verifyAuthToken } = require('./auth');
    const payload = verifyAuthToken(auth);
    if (payload) return { authenticated: true, userId: payload.userId };
  } catch {}
  return { authenticated: false };
}
