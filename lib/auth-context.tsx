
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

interface AuthContextType {
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    departments: string;
  } | null;
  loading: boolean;
  canAccessDepartment: (deptId: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  canAccessDepartment: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const profile = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role,
        departments: session.user.departments,
      }
    : null;

  const canAccessDepartment = (deptId: string): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    // dashboard is always accessible
    if (deptId === 'dashboard') return true;
    const depts = profile.departments.split(',').map(d => d.trim()).filter(Boolean);
    return depts.includes(deptId);
  };

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/login' });
  };

  return (
    <AuthContext.Provider value={{ profile, loading, canAccessDepartment, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);