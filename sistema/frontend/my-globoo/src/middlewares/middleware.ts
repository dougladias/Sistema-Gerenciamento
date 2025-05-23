import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/pages/dashboard',
  '/pages/workers',
  '/pages/documents',
  '/pages/timeSheet',
  '/pages/templates',
  '/pages/payroll',
  '/pages/invoice',
  '/pages/visitors',
  '/pages/provider',
  '/pages/support'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verifica se é uma rota de API (deixa passar)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Verifica se é uma rota de arquivos estáticos (deixa passar)
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.startsWith('/static/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Verifica se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Obtém o token do cookie ou header
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Se for rota protegida e não tiver token, redireciona para login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se for rota pública e tiver token (usuário logado tentando acessar login), 
  // redireciona para dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/pages/dashboard', request.url));
  }
  
  // Se for rota raiz e tiver token, redireciona para dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/pages/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configuração do matcher - define em quais rotas o middleware será executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};