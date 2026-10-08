import { z } from 'zod';

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const webhookSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name is too long'),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .refine(isHttpUrl, 'Enter a valid http:// or https:// URL'),
});

export type WebhookForm = z.infer<typeof webhookSchema>;
