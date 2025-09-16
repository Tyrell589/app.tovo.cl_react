/**
 * @fileoverview Authentication context provider for global auth state
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, getClientSession, clearSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  login: (session: Session) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const existingSession = getClientSession();
    setSession(existingSession);
    setIsLoading(false);
  }, []);

  const login = (newSession: Session) => {
    setSession(newSession);
  };

  const logout = () => {
    clearSession();
    setSession(null);
    router.push('/');
  };

  const value: AuthContextType = {
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
