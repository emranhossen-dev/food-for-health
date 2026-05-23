import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // For now, disable middleware to test login flow
  // TODO: Re-enable after fixing login redirect
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
