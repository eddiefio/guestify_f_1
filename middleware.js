// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  // Host routes that require authentication
  const hostRoutes = [
    '/host',
    '/host/dashboard',
    '/host/add-property',
    '/host/edit-property',
    '/host/delete-property',
    '/host/inventory',
    '/host/analytics',
    '/host/orders',
    '/host/printqr',
    '/host/profile',
    '/host/change-password',
  ];

  // Check if the current route is protected
  const isProtectedRoute = hostRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Create authenticated Supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    
    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

// Configure which paths middleware should run on
export const config = {
  matcher: [
    '/host/:path*',
  ],
};