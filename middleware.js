// middleware.js
// DISABILITATO - Utilizziamo ora un sistema basato su componenti per la protezione delle rotte

import { NextResponse } from 'next/server';

export function middleware(req) {
  // Semplicemente lasciamo passare tutte le richieste
  return NextResponse.next();
}

// Manteniamo il matcher vuoto per disabilitare il middleware
export const config = {
  matcher: [],
};