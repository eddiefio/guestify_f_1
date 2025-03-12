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
      // Verifica se siamo già nella pagina di login per evitare redirect loop
      const redirectUrl = new URL('/auth/signin', req.url);
      
      // Assicuriamoci di non perdere la query string originale
      const currentUrl = new URL(req.url);
      if (currentUrl.searchParams.has('redirectedFrom')) {
        // Se siamo già stati reindirizzati, non lo facciamo di nuovo
        return NextResponse.next();
      }
      
      // Aggiungiamo il parametro per tracciare il reindirizzamento
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      
      // Impostiamo un cookie per prevenire loop di redirect
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set('auth_redirect_attempted', 'true', {
        maxAge: 60, // 60 secondi
        path: '/'
      });
      
      return response;
    } else {
      // Se abbiamo una sessione valida, procediamo
      const response = NextResponse.next();
      
      // Rimuoviamo il cookie di redirect se esistente
      if (req.cookies.has('auth_redirect_attempted')) {
        response.cookies.delete('auth_redirect_attempted');
      }
      
      return response;
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