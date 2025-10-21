import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Definir rutas públicas (no requieren token)
  const publicPaths = ['/login', '/registro', '/', '/agenda'];

  // 2. Si es una ruta pública Y NO es /admin, dejar pasar
  if (publicPaths.includes(pathname) && !pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // 3. Obtener token
  const token = request.cookies.get('token')?.value;

  // 4. Si la ruta es protegida (ej: /admin) Y no hay token, redirigir a login
  if (!token && pathname.startsWith('/admin')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Si hay token, verificarlo (para CUALQUIER ruta protegida)
  if (token) {
    try {
      const res = await fetch('http://localhost:3001/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Token inválido');
      }

      const data = await res.json();
      const user = data.user;

      // 6. Lógica de autorización
      if (pathname.startsWith('/admin')) {
        if (user.rol === 'admin') {
          return NextResponse.next(); // Permitido: Admin en ruta /admin
        } else {
          // No es admin, pero intenta entrar a /admin
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(loginUrl);
        }
      }
      
      // (Aquí añadirías lógica para /dashboard/externo, /dashboard/unsa, etc.)

      // 7. Si el usuario está logueado e intenta ir a /login o /registro, redirigir
      if (publicPaths.includes(pathname)) {
        if(user.rol === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        // (Aquí redirigir a /dashboard/externo o /dashboard/unsa)
      }
      
      return NextResponse.next();

    } catch (error) {
      // 8. El token es inválido o expiró
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session_expired');
      
      // Borrar la cookie inválida
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }
  }

  // Fallback: si no es admin y no hay token, simplemente dejar pasar (para rutas públicas)
  return NextResponse.next();
}

// El "Matcher"
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};