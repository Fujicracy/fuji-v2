import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

export async function limit(request: NextRequest) {
  try {
    const ip = _getIp(request);
    const { limit } = await ratelimit.limit(ip);
    if (limit === 0) {
      throw 'Rate limit exceeded';
    }
  } catch (error) {
    throw error;
  }
}

function _getIp(req: NextRequest) {
  let ip =
    req.ip ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for') ||
    '127.0.01';

  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0];
  }

  return ip;
}
