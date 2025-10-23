import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Allow public access to items API for landing page
  if (pathname === '/api/items' && request.method === 'GET') {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const userRole = token.role as string

  // Role-based access control
  if (pathname.startsWith('/dashboard/pengurus') && userRole !== 'PENGURUS') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/dashboard/kasir') && userRole !== 'KASIR') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (pathname.startsWith('/dashboard/mitra') && userRole !== 'MITRA') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/menu',
    '/api/items/:path*',
    '/api/transactions/:path*',
    '/api/users/:path*',
  ],
}
