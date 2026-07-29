import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('__admin_session')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!adminSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (adminSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
