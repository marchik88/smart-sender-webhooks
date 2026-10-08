# Smart Sender webhooks

Login, webhook list and edit form on top of a mocked API (MSW).

React 19, TypeScript (strict), React Router 7, TanStack Query 5, axios, react-hook-form + zod, MSW 2, Vitest.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # session test
npm run build      # typecheck + production build
```

Node 20+.

Test credentials: `admin@example.com` / `secret123`

## Structure

```
src/
  api/        http client (CSRF, session refresh), endpoints, types, errors
  auth/       AuthProvider, route guard, redirect after login
  webhooks/   queries, URL params, form schema, list components
  pages/      login, list, edit
  toast/      notification store and Toaster
  mocks/      MSW handlers and in-memory db
  global.d.ts   module augmentations (axios request config, react-query meta)
```

UI doesn't know about tokens or retries. Everything about CSRF and session lives in `api/http.ts`, the React side only gets notified when the session is over.

## Decisions

- Session: one axios interceptor. On 401 all requests wait for one shared rotate and are retried once. Rotate itself never triggers a rotate.
- CSRF: every request waits for `GET /csrf` first. On 419 the token is reloaded and the request retried once.
- `page` and `search` live only in the URL, so reload, back/forward and the login redirect restore them.
- Logout or session end aborts pending requests and clears the query cache.

## Mock

- Session lives 30 s, rotate extends it by 30 s, 400 before issue and after revoke or on fingerprint mismatch.
- CSRF is checked on every POST/PUT before anything else.
- `/auth/login` requires a non-empty `X-Captcha-Token`.
- 27 webhooks, stable order, case-insensitive substring search, `limit=10`.

## Not done

- Rotate coordination between tabs (Web Locks + "someone already rotated" check). With a real cookie two tabs could rotate at the same time. Here every tab has its own mock state, so it can't be shown honestly.
- Tests beyond the required one: 419 retry, rotate failure, URL params, form errors.
- Response validation with zod.
- Login in one tab doesn't log in the other ones (again, separate mock state per tab).
