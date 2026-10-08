import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getMe, login, logout } from '../api/auth';
import { abortPendingRequests, onSessionExpired } from '../api/http';
import type { User } from '../api/types';

type AuthState =
  { status: 'checking' } | { status: 'authenticated'; user: User } | { status: 'anonymous' };

type AuthContextValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const channel = new BroadcastChannel('auth');

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'checking' });

  const endSession = useCallback(() => {
    abortPendingRequests();
    queryClient.clear();
    setState({ status: 'anonymous' });
  }, [queryClient]);

  useEffect(() => onSessionExpired(endSession), [endSession]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.data === 'logout') endSession();
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [endSession]);

  const restoring = useRef(false);
  useEffect(() => {
    if (restoring.current) return;
    restoring.current = true;
    getMe().then(
      (user) => setState({ status: 'authenticated', user }),
      () => setState({ status: 'anonymous' }),
    );
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await login(email, password);
    setState({ status: 'authenticated', user });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      channel.postMessage('logout');
      endSession();
    }
  }, [endSession]);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useCurrentUser(): User {
  const { state } = useAuth();
  if (state.status !== 'authenticated') throw new Error('No authenticated user');
  return state.user;
}
