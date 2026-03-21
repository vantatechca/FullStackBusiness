// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { supabase } from '@/lib/supabase';
// import { ChartBar as BarChart3, Loader as Loader2 } from 'lucide-react';

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

//     if (authError) {
//       setError(authError.message);
//       setLoading(false);
//       return;
//     }

//     router.push('/dashboard');
//   };

//   return (
//     <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#3b82f6] mb-4">
//             <BarChart3 className="text-white" size={28} />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900">Business Hub</h1>
//           <p className="text-gray-500 mt-1">Sign in to your account</p>
//         </div>

//         <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
//           <form onSubmit={handleSubmit} className="space-y-5">
//             {error && (
//               <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
//                 {error}
//               </div>
//             )}

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//                 className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-colors"
//                 placeholder="you@company.com"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 required
//                 className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-colors"
//                 placeholder="Enter your password"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
//             >
//               {loading && <Loader2 size={16} className="animate-spin" />}
//               Sign In
//             </button>
//           </form>
//         </div>

//         <p className="text-center text-sm text-gray-500 mt-6">
//           Don&apos;t have an account?{' '}
//           <Link href="/signup" className="text-[#3b82f6] font-medium hover:underline">
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }



'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ChartBar as BarChart3, Loader as Loader2 } from 'lucide-react';

export default function LoginPage() {
  // const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    setError('Invalid email or password');
    setLoading(false);
    return;
  }

  window.location.href = '/dashboard';
};

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#3b82f6] mb-4">
            <BarChart3 className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Hub</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b82f6] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#3b82f6] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
