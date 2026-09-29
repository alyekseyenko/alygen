import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../utils/api';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  isAuthRequired,
  setSession,
} from '../utils/auth-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAccessToken());

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.error || 'Login falhou');
    setSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const registerBootstrap = useCallback(async (email, password, displayName) => {
    const { data } = await api.post(
      '/auth/register',
      { email, password, displayName }
    );
    if (!data.success) throw new Error(data.error || 'Registo falhou');
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      authRequired: isAuthRequired(),
      login,
      logout,
      registerBootstrap,
    }),
    [user, token, login, logout, registerBootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
