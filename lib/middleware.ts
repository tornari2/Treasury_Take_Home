import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { cookies } from 'next/headers';

export async function requireAuth(request: NextRequest): Promise<{ user: any } | NextResponse> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = getCurrentUser(sessionId);

  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  return { user };
}

export async function requireAdmin(request: NextRequest): Promise<{ user: any } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return authResult;
}
