/**
 * Run this once to set your admin password:
 * npx tsx scripts/set-admin-password.ts
 */

import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';

async function setAdminPassword() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/set-admin-password.ts <email> <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  // Check if profile exists
  const existing = await sql`SELECT id FROM public.profiles WHERE email = ${email}`;

  if (existing.length > 0) {
    await sql`
      UPDATE public.profiles
      SET password_hash = ${hash}, role = 'admin'
      WHERE email = ${email}
    `;
    console.log(`✅ Updated password for ${email}`);
  } else {
    await sql`
      INSERT INTO public.profiles (email, full_name, role, password_hash)
      VALUES (${email}, 'Admin', 'admin', ${hash})
    `;
    console.log(`✅ Created admin account for ${email}`);
  }

  process.exit(0);
}

setAdminPassword().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});