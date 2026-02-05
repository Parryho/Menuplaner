import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/health',
];

const STATIC_PREFIXES = [
  '/_next/',
  '/favicon.ico',
  '/fonts/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p)) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authToken = request.cookies.get('auth-token')?.value;
  const expectedToken = process.env.AUTH_SECRET || 'menuplaner-default-secret';

  if (authToken === expectedToken) {
    return NextResponse.next();
  }

  // API routes return 401, pages redirect to login
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Nicht autorisiert' },
      { status: 401 }
    );
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
