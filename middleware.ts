// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In middleware.ts
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get auth session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If trying to access a protected route without a session, redirect to login
  if (!session && req.nextUrl.pathname.startsWith('/host/')) {
    // Check if there's a recent sign-in cookie
    const recentSignin = req.cookies.get('recent-signin');
    
    // If there's a recent sign-in, allow the navigation to proceed
    if (recentSignin) {
      return res;
    }

    // Check if there's a stored auth session in cookies
    const authCookie = req.cookies.get('supabase-auth');
    if (authCookie) {
      return res; // Let the request proceed if we have an auth cookie
    }
    
    // Otherwise redirect to sign-in
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    return NextResponse.redirect(url);
  }

  return res;
}

// Updated matcher pattern to only check host routes
export const config = {
  matcher: [
    '/host/:path*',  // Only apply to host routes
  ],
};