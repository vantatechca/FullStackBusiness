// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth-context';
// import { CurrencyProvider } from '@/lib/currency-context';
// import Sidebar from '@/components/Sidebar';
// import TopBar from '@/components/TopBar';

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push('/login');
//     }
//   }, [user, loading, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!user) return null;

//   return (
//     <CurrencyProvider>
//       <div className="flex min-h-screen bg-[#f8fafc]">
//         <Sidebar />
//         <div className="flex-1 flex flex-col min-w-0">
//           <TopBar />
//           <main className="flex-1 p-6 overflow-x-hidden">
//             {children}
//           </main>
//         </div>
//       </div>
//     </CurrencyProvider>
//   );
// }




'use client';

import { useAuth } from '@/lib/auth-context';
import { CurrencyProvider } from '@/lib/currency-context';
import Sidebar from '@/components/Sidebar';  // match your exact filename casing
import TopBar from '@/components/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <CurrencyProvider>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}