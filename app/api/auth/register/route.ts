import { NextResponse } from 'next/server';

// Public registration is disabled.
// Users can only be created by admin/super_admin via the Admin Panel.
export async function POST() {
  return NextResponse.json(
    { error: 'Registration is disabled. Contact your administrator.' },
    { status: 403 }
  );
}
