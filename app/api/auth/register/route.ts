import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sql } from '@/lib/db';

// POST /api/auth/register
export async function POST(req: Request) {
  try {
    const { fullName, email, password } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM public.profiles WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password with same cost factor as existing accounts
    const password_hash = await bcrypt.hash(password, 12);

    // Insert new profile — role defaults to 'member'
    const rows = await sql`
      INSERT INTO public.profiles (email, full_name, role, password_hash)
      VALUES (${email}, ${fullName}, 'member', ${password_hash})
      RETURNING id, email, full_name, role, created_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}