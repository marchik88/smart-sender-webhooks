import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WebhookInput } from '../api/types';
import { getWebhook, getWebhooks, updateWebhook, type WebhookListParams } from '../api/webhooks';

const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (params: WebhookListParams) => [...webhookKeys.lists(), params] as const,
  detail: (id: number) => [...webhookKeys.all, 'detail', id] as const,
};

export function useWebhookList(params: WebhookListParams) {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: ({ signal }) => getWebhooks(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useWebhook(id: number, enabled = true) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: ({ signal }) => getWebhook(id, signal),
    enabled,
  });
}

export function useUpdateWebhook(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WebhookInput) => updateWebhook(id, input),
    meta: { successTitle: 'Webhook saved' },
    onSuccess: (webhook) => {
      queryClient.setQueryData(webhookKeys.detail(id), webhook);
      return queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}
