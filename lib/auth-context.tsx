'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, TeamMember } from './types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  teamMember: TeamMember | null;
  loading: boolean;
  canAccessDepartment: (deptId: string) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  teamMember: null,
  loading: true,
  canAccessDepartment: () => false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    const { data: tmData } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (tmData) {
      setTeamMember(tmData as TeamMember);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email || '');
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email || '');
      } else {
        setProfile(null);
        setTeamMember(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const canAccessDepartment = useCallback((deptId: string) => {
    if (!profile) return false;
    if (deptId === 'dashboard') return true;
    if (deptId === 'admin') return profile.role === 'admin';
    if (profile.role === 'admin') return true;

    if (!teamMember?.departments) return false;
    const depts = teamMember.departments.split(',').map(d => d.trim());
    return depts.includes(deptId);
  }, [profile, teamMember]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setTeamMember(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, teamMember, loading, canAccessDepartment, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
