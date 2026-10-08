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

**Session refresh.** One axios response interceptor. On 401 the request waits for a shared rotate promise and is retried once. The rotate request itself is marked `skipSessionRefresh`, so it never triggers another rotate. Rotate failure or a second 401 calls `onSessionExpired`, which clears state and cache.

There is also a session generation counter, bumped after each successful rotate. If a request was sent before a rotate finished and got 401 afterwards, it's retried right away without rotating again.

**CSRF.** All requests wait for `GET /csrf` in the request interceptor (one shared promise), so there is no race on app start. The token goes to POST and PUT. On 419 the token is reloaded and the request retried once; this retry is counted separately from the 401 one.

**Tokens.** `device_session_token` exists only inside `login()` between `/auth/login` and `/auth/token/issue`. The fingerprint is 16 random bytes in hex, created once and kept in localStorage.

**Reload.** The mock keeps its state in memory, so after reload the session is gone: `/v1/me` gets 401, rotate gets 400, the user sees the login page. The original URL is passed as `?redirect=` (only same-origin paths are accepted), so after login the list opens with the same page and search.

**URL state.** `page` and `search` are read from the URL with `useSearchParams` (`?page=abc` becomes 1). Search is debounced and pushes a history entry, page change pushes too, so back/forward walks through them. Changing search drops `page`. The previous page stays visible (dimmed) while the next one loads.

**Cancellation.** Queries pass the React Query `signal` to axios, so a list request is aborted when the user moves on. All requests are also tied to a session-level `AbortController` that is aborted on logout or session end, so a late response can't refill the cleared cache.

**Tabs.** Logout is broadcast through `BroadcastChannel`, the other tabs drop their state and go to the login page.

**Notifications.** Errors are shown in place: load errors on the page with a Try again button, save errors in the form. The only toast is "Webhook saved" after a successful save; it comes from `MutationCache.onSuccess` and the title is taken from the mutation `meta`. Queries don't auto-retry 5xx so failures are visible; network errors are retried once. The toast store is a small module with `useSyncExternalStore`, no library.

**Forms.** zod validates on the client. Server 422 errors are mapped to fields with `setError`; any other save error (network, 5xx) goes to a form-level message. To see a server error while client validation passes, rename a webhook to an existing name (e.g. "Order paid"): the mock rejects duplicates.

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
