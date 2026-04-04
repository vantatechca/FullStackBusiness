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
  isSuperAdmin: boolean;
  isAdmin: boolean;       // admin or super_admin
  isManager: boolean;     // manager or above
  isLead: boolean;        // lead or above
  canEdit: boolean;       // lead+ can edit within their scope
  canAccessDepartment: (deptId: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isManager: false,
  isLead: false,
  canEdit: false,
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

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin;
  const isManager = profile?.role === 'manager' || isAdmin;
  const isLead = profile?.role === 'lead' || isManager;
  const canEdit = isLead; // lead+ can edit within their scope

  const canAccessDepartment = (deptId: string): boolean => {
    if (!profile) return false;
    // Manager+ can access all departments
    if (isManager) return true;
    // Dashboard is always accessible
    if (deptId === 'dashboard') return true;
    // Lead and member: check department assignment
    const depts = profile.departments.split(',').map(d => d.trim()).filter(Boolean);
    return depts.includes(deptId);
  };

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/login' });
  };

  return (
    <AuthContext.Provider value={{ profile, loading, isSuperAdmin, isAdmin, isManager, isLead, canEdit, canAccessDepartment, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
