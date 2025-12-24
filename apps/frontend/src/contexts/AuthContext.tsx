'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, getCurrentUser } from '../lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_FAILURE':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: action.payload.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: { error: '' } });
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      const { isAuthenticated: auth, user, loading } = event.detail;
      if (loading === true) {
        dispatch({ type: 'AUTH_START' });
      } else if (auth && user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
      } else if (!auth && user === null) {
        dispatch({ type: 'AUTH_FAILURE', payload: { error: '' } });
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange as EventListener);
    return () => window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
  }, []);

  const login = (user: User) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
  };

  const logout = () => {
    dispatch({ type: 'AUTH_FAILURE', payload: { error: '' } });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
