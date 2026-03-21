// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

// export default function Home() {
//   const router = useRouter();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) {
//         router.push('/dashboard');
//       } else {
//         router.push('/login');
//       }
//     });
//   }, [router]);

//   return (
//     <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
//       <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
//     </div>
//   );
// }




'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}