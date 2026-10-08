const DEFAULT_PATH = '/webhooks';

export function loginPath(from: string) {
  return `/login?redirect=${encodeURIComponent(from)}`;
}

export function safeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return DEFAULT_PATH;
  return value;
}
