/**
 * @fileoverview Authentication utilities and session management
 */

import { cookies } from 'next/headers';
import { JWTPayload } from '@tovocl/types';
import jwt from 'jsonwebtoken';

export interface Session {
  user: {
    usu_codigo: number;
    usu_email: string;
    usu_nombre: string;
    usu_apellidopat: string;
    rol_codigo: number;
    rol_nombre: string;
  };
  token: string;
}

/**
 * Get server-side session from cookies
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // In a real implementation, you would fetch user data from the database
    // For now, we'll return the decoded token data
    return {
      user: {
        usu_codigo: decoded.userId,
        usu_email: decoded.email,
        usu_nombre: 'User', // This would come from the database
        usu_apellidopat: 'Name',
        rol_codigo: decoded.roleId,
        rol_nombre: 'User' // This would come from the database
      },
      token: token
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Get client-side session from localStorage
 */
export function getClientSession(): Session | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return null;
    }

    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded) {
      return null;
    }

    return {
      user: {
        usu_codigo: decoded.userId,
        usu_email: decoded.email,
        usu_nombre: 'User',
        usu_apellidopat: 'Name',
        rol_codigo: decoded.roleId,
        rol_nombre: 'User'
      },
      token: token
    };
  } catch (error) {
    console.error('Client session error:', error);
    return null;
  }
}

/**
 * Set session in cookies and localStorage
 */
export function setSession(session: Session): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Set in localStorage
  localStorage.setItem('auth-token', session.token);
  localStorage.setItem('user-data', JSON.stringify(session.user));
}

/**
 * Clear session from cookies and localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('auth-token');
  localStorage.removeItem('user-data');
}

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null, requiredRole: number): boolean {
  if (!session) {
    return false;
  }

  // Admin role (1) has access to everything
  if (session.user.rol_codigo === 1) {
    return true;
  }

  return session.user.rol_codigo === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(session: Session | null, requiredRoles: number[]): boolean {
  if (!session) {
    return false;
  }

  // Admin role (1) has access to everything
  if (session.user.rol_codigo === 1) {
    return true;
  }

  return requiredRoles.includes(session.user.rol_codigo);
}
