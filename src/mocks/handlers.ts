import { delay, http, HttpResponse } from 'msw';
import type { ErrorBody, ErrorType, FieldErrors, WebhookList } from '../api/types';
import {
  CSRF_TOKEN,
  credentials,
  db,
  isSessionActive,
  SESSION_TTL,
  startSession,
  user,
} from './db';

const messages: Record<ErrorType, string> = {
  BadRequestException: 'Bad request.',
  AuthenticationException: 'Unauthenticated.',
  NotFoundException: 'Not found.',
  TokenMismatchException: 'CSRF token mismatch.',
  ValidationException: 'The given data was invalid.',
};

const statuses: Record<ErrorType, number> = {
  BadRequestException: 400,
  AuthenticationException: 401,
  NotFoundException: 404,
  TokenMismatchException: 419,
  ValidationException: 422,
};

function fail(type: ErrorType, payload?: FieldErrors) {
  return HttpResponse.json<ErrorBody>(
    { error: { type, message: messages[type], payload } },
    { status: statuses[type] },
  );
}

const invalid = (payload: FieldErrors) => fail('ValidationException', payload);

function hasValidCsrf(request: Request) {
  return request.headers.get('X-CSRF-TOKEN') === CSRF_TOKEN;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function isNameTaken(name: string, exceptId: number) {
  const lower = name.toLowerCase();
  return db.webhooks.some((w) => w.id !== exceptId && w.name.toLowerCase() === lower);
}

function positiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const handlers = [
  http.get(
    '/csrf',
    () => new HttpResponse(null, { status: 204, headers: { 'X-CSRF-TOKEN': CSRF_TOKEN } }),
  ),

  http.all('*', async ({ request }) => {
    const method = request.method;
    if ((method === 'POST' || method === 'PUT') && !hasValidCsrf(request)) {
      return fail('TokenMismatchException');
    }
  }),

  http.post('/auth/login', async ({ request }) => {
    await delay();
    if (!request.headers.get('X-Captcha-Token')) {
      return invalid({ captcha: ['The captcha token is required.'] });
    }

    const body = await readJson(request);
    const email = str(body.email);
    const password = str(body.password);
    const fingerprint = str(body.fingerprint);

    const errors: FieldErrors = {};
    if (!email) errors.email = ['The email field is required.'];
    if (!password) errors.password = ['The password field is required.'];
    if (!/^[0-9a-f]{32}$/.test(fingerprint)) errors.fingerprint = ['The fingerprint is invalid.'];
    if (Object.keys(errors).length) return invalid(errors);

    if (email.toLowerCase() !== credentials.email || password !== credentials.password) {
      return invalid({ password: ['These credentials do not match our records.'] });
    }

    const token = crypto.randomUUID();
    db.pendingTokens.set(token, fingerprint);
    return HttpResponse.json({ device_session_token: token });
  }),

  http.post('/auth/token/issue', async ({ request }) => {
    await delay();
    const body = await readJson(request);
    const token = str(body.device_session_token);
    const fingerprint = str(body.fingerprint);

    if (!token || db.pendingTokens.get(token) !== fingerprint) {
      return invalid({ device_session_token: ['The device session token is invalid.'] });
    }

    db.pendingTokens.delete(token);
    startSession(fingerprint);
    return HttpResponse.json({});
  }),

  http.post('/auth/token/rotate', async ({ request }) => {
    await delay();
    const { fingerprint } = await readJson(request);
    if (!db.session || db.session.fingerprint !== fingerprint) {
      return fail('BadRequestException');
    }
    db.session.expiresAt = Date.now() + SESSION_TTL;
    return HttpResponse.json({});
  }),

  http.post('/auth/token/revoke', async () => {
    db.session = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.all('/v1/*', () => {
    if (!isSessionActive()) return fail('AuthenticationException');
  }),

  http.get('/v1/me', async () => {
    await delay();
    return HttpResponse.json(user);
  }),

  http.get('/v1/webhooks', async ({ request }) => {
    await delay();
    const params = new URL(request.url).searchParams;
    const page = positiveInt(params.get('page'), 1);
    const limit = positiveInt(params.get('limit'), 10);
    const search = (params.get('search') ?? '').trim().toLowerCase();

    const found = search
      ? db.webhooks.filter((w) => w.name.toLowerCase().includes(search))
      : db.webhooks;

    return HttpResponse.json<WebhookList>({
      data: found.slice((page - 1) * limit, page * limit),
      paging: {
        pages: { current: page, last: Math.max(1, Math.ceil(found.length / limit)) },
        results: { total: found.length, limitation: limit },
      },
    });
  }),

  http.get('/v1/webhooks/:id', async ({ params }) => {
    await delay();
    const webhook = db.webhooks.find((w) => w.id === Number(params.id));
    return webhook ? HttpResponse.json(webhook) : fail('NotFoundException');
  }),

  http.put('/v1/webhooks/:id', async ({ request, params }) => {
    await delay();
    const webhook = db.webhooks.find((w) => w.id === Number(params.id));
    if (!webhook) return fail('NotFoundException');

    const body = await readJson(request);
    const name = str(body.name);
    const url = str(body.url);

    const errors: FieldErrors = {};
    if (!name) errors.name = ['The name field is required.'];
    else if (name.length > 255) errors.name = ['The name may not be greater than 255 characters.'];
    else if (isNameTaken(name, webhook.id)) errors.name = ['The name has already been taken.'];
    if (!url) errors.url = ['The url field is required.'];
    else if (!isHttpUrl(url)) errors.url = ['The url must be a valid URL.'];
    if (Object.keys(errors).length) return invalid(errors);

    Object.assign(webhook, { name, url });
    return HttpResponse.json(webhook);
  }),
];
