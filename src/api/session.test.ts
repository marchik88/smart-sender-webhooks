import { afterAll, beforeAll, expect, it } from 'vitest';
import { credentials, expireSession } from '../mocks/db';
import { server } from '../mocks/node';
import { getMe, login } from './auth';
import { getWebhooks } from './webhooks';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterAll(() => server.close());

it('parallel 401s share one rotate and both requests are retried', async () => {
  await login(credentials.email, credentials.password);
  expireSession();

  const calls: string[] = [];
  server.events.on('request:start', ({ request }) => {
    calls.push(`${request.method} ${new URL(request.url).pathname}`);
  });

  const [me, list] = await Promise.all([getMe(), getWebhooks({ page: 1, search: '' })]);

  expect(me.email).toBe(credentials.email);
  expect(list.data).toHaveLength(10);
  expect(calls.filter((c) => c === 'POST /auth/token/rotate')).toHaveLength(1);
  expect(calls.filter((c) => c === 'GET /v1/me')).toHaveLength(2);
  expect(calls.filter((c) => c === 'GET /v1/webhooks')).toHaveLength(2);
});
