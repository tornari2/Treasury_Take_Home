import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { auditLogHelpers } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      const user = getCurrentUser(sessionId);

      if (user) {
        // Log logout action
        auditLogHelpers.create(user.id, 'logout');
      }

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
