// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { User, SignupRequest, LoginRequest } from '@/types';

interface AuthState {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // 초기화: localStorage에서 인증 정보 복원
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setState({ user, token, isLoading: false });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const result = await authApi.login(data);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setState({ user: result.user, token: result.token, isLoading: false });
    return result;
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    const result = await authApi.signup(data);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setState({ user: result.user, token: result.token, isLoading: false });
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, isLoading: false });
    router.push('/login');
  }, [router]);

  return {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    login,
    signup,
    logout,
  };
}
