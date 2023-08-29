import { NextRequest, NextResponse } from 'next/server';

import { ApiRoute, Status } from './pages/api/helpers/constants';
import { limit } from './pages/api/helpers/limiter';

export default async function middleware(req: NextRequest) {
  if (!_isAPIRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    await limit(req);
    return NextResponse.next();
  } catch (error) {
    console.error(error);
    return new NextResponse(`Rate limit exceeded ${req.method}`, {
      status: Status.TOO_MANY_REQUESTS,
    });
  }
}

function _isAPIRoute(route: string): boolean {
  return Object.values(ApiRoute).includes(route as ApiRoute);
}
