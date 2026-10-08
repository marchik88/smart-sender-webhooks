import { http } from './http';
import type { Webhook, WebhookInput, WebhookList } from './types';

const PAGE_SIZE = 10;

export type WebhookListParams = { page: number; search: string };

export async function getWebhooks(
  { page, search }: WebhookListParams,
  signal?: AbortSignal,
): Promise<WebhookList> {
  const { data } = await http.get<WebhookList>('/v1/webhooks', {
    params: { page, limit: PAGE_SIZE, search: search || undefined },
    signal,
  });
  return data;
}

export async function getWebhook(id: number, signal?: AbortSignal): Promise<Webhook> {
  const { data } = await http.get<Webhook>(`/v1/webhooks/${id}`, { signal });
  return data;
}

export async function updateWebhook(id: number, input: WebhookInput): Promise<Webhook> {
  const { data } = await http.put<Webhook>(`/v1/webhooks/${id}`, input);
  return data;
}
