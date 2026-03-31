
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Signup is disabled — only admins can create users via the Admin Panel
export default function SignUpPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
