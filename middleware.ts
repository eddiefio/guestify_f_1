import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and we're trying to access protected routes
  if (!session && (req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname.startsWith('/host/'))) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return res;
}

export const config = {
  matcher: [
    '/api/printqr-pdf',
    '/host/:path*'
  ],
};