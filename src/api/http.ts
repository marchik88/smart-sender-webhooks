import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toApiError } from './errors';
import { getFingerprint } from './fingerprint';

const baseHeaders = { 'X-Requested-With': 'XMLHttpRequest' };

export const http = axios.create({ headers: baseHeaders });

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

function loadCsrfToken(): Promise<string> {
  csrfRequest ??= axios
    .get('/csrf', { headers: baseHeaders })
    .then((res) => {
      const token = res.headers['x-csrf-token'];
      if (typeof token !== 'string' || !token) throw new Error('CSRF token is missing');
      csrfToken = token;
      return token;
    })
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
}

let sessionGeneration = 0;
let rotateRequest: Promise<void> | null = null;

function rotateSession(): Promise<void> {
  rotateRequest ??= http
    .post('/auth/token/rotate', { fingerprint: getFingerprint() }, { skipSessionRefresh: true })
    .then(() => {
      sessionGeneration++;
    })
    .finally(() => {
      rotateRequest = null;
    });
  return rotateRequest;
}

let sessionAbort = new AbortController();

export function abortPendingRequests() {
  sessionAbort.abort();
  sessionAbort = new AbortController();
}

let sessionExpiredListener: () => void = () => {};

export function onSessionExpired(listener: () => void) {
  sessionExpiredListener = listener;
  return () => {
    sessionExpiredListener = () => {};
  };
}

function withSessionSignal(config: InternalAxiosRequestConfig) {
  const own = config.signal as AbortSignal | undefined;
  config.signal = own ? AbortSignal.any([own, sessionAbort.signal]) : sessionAbort.signal;
}

http.interceptors.request.use(async (config) => {
  const isRetry = config.sessionGeneration !== undefined;
  if (!isRetry) withSessionSignal(config);

  const token = csrfToken ?? (await loadCsrfToken());
  const method = config.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT') {
    config.headers.set('X-CSRF-TOKEN', token);
  }

  config.sessionGeneration ??= sessionGeneration;
  return config;
});

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;
  const status = error.response?.status;
  if (!config) throw toApiError(error);

  if (status === 419 && !config.csrfRetried) {
    config.csrfRetried = true;
    csrfToken = null;
    await loadCsrfToken();
    return http(config);
  }

  if (status === 401 && !config.skipSessionRefresh) {
    if (config.sessionRetried) {
      sessionExpiredListener();
      throw toApiError(error);
    }
    config.sessionRetried = true;

    if (config.sessionGeneration === sessionGeneration) {
      try {
        await rotateSession();
      } catch {
        sessionExpiredListener();
        throw toApiError(error);
      }
    }
    config.sessionGeneration = sessionGeneration;
    return http(config);
  }

  throw toApiError(error);
});
