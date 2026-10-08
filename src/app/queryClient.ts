import { MutationCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '../api/errors';
import { notify } from '../toast/store';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const title = mutation.meta?.successTitle;
      if (title) notify({ title });
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 1 && isApiError(error) && error.type === 'NetworkError',
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
