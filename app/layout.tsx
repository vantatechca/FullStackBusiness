// import './globals.css';
// import type { Metadata } from 'next';
// import { AuthProvider } from '@/lib/auth-context';
// import { Toaster } from '@/components/ui/sonner';

// export const metadata: Metadata = {
//   title: 'Business Hub',
//   description: 'Business Management Dashboard',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="font-sans antialiased">
//         <AuthProvider>
//           {children}
//           <Toaster position="top-right" />
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }






import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business Hub',
  description: 'Business management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}