import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  departments: string;
}

declare module 'next-auth' {
  interface Session {
    user: UserProfile;
  }
  interface User extends UserProfile {}
}

declare module 'next-auth/jwt' {
  interface JWT extends UserProfile {}
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await sql`
          SELECT p.id, p.email, p.full_name, p.role, p.password_hash,
                 COALESCE(tm.departments, '') as departments
          FROM public.profiles p
          LEFT JOIN public.team_members tm ON tm.email = p.email
          WHERE p.email = ${credentials.email}
          LIMIT 1
        `;

        const user = rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          departments: user.departments,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.full_name = user.full_name;
        token.role = user.role;
        token.departments = user.departments;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        full_name: token.full_name as string,
        role: token.role as string,
        departments: token.departments as string,
      };
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};