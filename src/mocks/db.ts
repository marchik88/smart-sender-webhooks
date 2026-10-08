import type { User, Webhook } from '../api/types';

export const CSRF_TOKEN = 'mock-csrf-3f9a1c7e';
export const SESSION_TTL = 30_000;

export const credentials = {
  email: 'admin@example.com',
  password: 'secret123',
};

export const user: User = {
  id: 1,
  email: credentials.email,
  first_name: 'Olena',
  last_name: 'Kovalenko',
  name: 'Olena Kovalenko',
};

const events = [
  'Order created',
  'Order paid',
  'Order cancelled',
  'Order shipped',
  'Payment received',
  'Payment failed',
  'Refund issued',
  'Contact subscribed',
  'Contact unsubscribed',
  'Contact tag added',
  'Contact updated',
  'Message received',
  'Message delivered',
  'Message read',
  'Broadcast finished',
  'Funnel completed',
  'Funnel step reached',
  'Chat assigned',
  'Chat closed',
  'Operator replied',
  'Lead created',
  'Lead qualified',
  'Invoice sent',
  'Subscription renewed',
  'Subscription expired',
  'Form submitted',
  'Bot blocked',
];

function seed(): Webhook[] {
  const start = Date.UTC(2026, 0, 12, 9, 0);
  return events.map((name, i) => ({
    id: i + 1,
    name,
    url: `https://hooks.example.com/${name.toLowerCase().replaceAll(' ', '-')}`,
    active: i % 4 !== 3,
    created_at: new Date(start + i * 86_400_000 * 3).toISOString(),
  }));
}

type Session = { fingerprint: string; expiresAt: number };

export const db = {
  webhooks: seed(),
  pendingTokens: new Map<string, string>(),
  session: null as Session | null,
};

export function startSession(fingerprint: string) {
  db.session = { fingerprint, expiresAt: Date.now() + SESSION_TTL };
}

export function isSessionActive() {
  return db.session !== null && db.session.expiresAt > Date.now();
}

export function expireSession() {
  if (db.session) db.session.expiresAt = 0;
}
