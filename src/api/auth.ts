import { getFingerprint } from './fingerprint';
import { http } from './http';
import type { User } from './types';

const CAPTCHA_TOKEN = 'mock-captcha-token';

export async function login(email: string, password: string): Promise<User> {
  const fingerprint = getFingerprint();

  const { data } = await http.post<{ device_session_token: string }>(
    '/auth/login',
    { email, password, fingerprint },
    { headers: { 'X-Captcha-Token': CAPTCHA_TOKEN }, skipSessionRefresh: true },
  );

  await http.post(
    '/auth/token/issue',
    { device_session_token: data.device_session_token, fingerprint },
    { skipSessionRefresh: true },
  );

  return getMe();
}

export async function logout(): Promise<void> {
  await http.post(
    '/auth/token/revoke',
    { fingerprint: getFingerprint() },
    { skipSessionRefresh: true },
  );
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  const { data } = await http.get<User>('/v1/me', { signal });
  return data;
}
