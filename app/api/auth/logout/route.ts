import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      // Skip audit logging since authentication is disabled
      // When auth is re-enabled, add:
      //   const user = getCurrentUser(sessionId);
      //   if (user) auditLogHelpers.create(user.id, 'logout');
      
      // Delete session
      deleteSession(sessionId);
    }

    // Clear cookie
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
