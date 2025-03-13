import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Add session user to response headers
  if (session) {
    res.headers.set('x-user-id', session.user.id);
  }

  return res;
}

export const config = {
  matcher: [
    '/api/printqr-pdf',
    '/host/:path*'
  ],
};