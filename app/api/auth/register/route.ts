import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createSession } from '@/lib/auth';
import { userHelpers } from '@/lib/db-helpers';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = userHelpers.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (default role is 'agent')
    const result = userHelpers.create(email, passwordHash, name, 'agent');

    // Create session and log them in automatically
    const sessionId = createSession(Number(result.lastInsertRowid));

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.lastInsertRowid,
          email,
          name,
          role: 'agent',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
