import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('__admin_session')?.value;
  const { pathname } = request.nextUrl;

  // Exclude public routes (Login, Auth APIs, UploadThing, static assets)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/uploadthing') ||
    pathname.startsWith('/api/sentry-example-api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const payload = adminSession ? await verifyToken(adminSession) : null;
  const isAuthorized = Boolean(
    payload && (payload.role === 'admin' || payload.role === 'super_admin')
  );

  if (!isAuthorized) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
