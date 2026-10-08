import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { isApiError } from '../api/errors';
import type { Webhook } from '../api/types';
import { Spinner } from '../components/Spinner';
import { setServerErrors } from '../lib/serverErrors';
import { useUpdateWebhook, useWebhook } from '../webhooks/queries';
import { webhookSchema, type WebhookForm } from '../webhooks/schema';

function listPathFrom(state: unknown) {
  const from =
    typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string'
      ? state.from
      : '';
  return `/webhooks${from.startsWith('?') ? from : ''}`;
}

export function WebhookEditPage() {
  const params = useParams();
  const location = useLocation();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const backTo = listPathFrom(location.state);

  const { data, error, isPending, isError, refetch } = useWebhook(id, validId);

  let content;
  if (!validId || isApiError(error, 404)) {
    content = <p>Webhook not found.</p>;
  } else if (isPending) {
    content = <Spinner />;
  } else if (isError) {
    content = (
      <div className="state">
        <p className="error">Could not load webhook: {error.message}</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  } else {
    content = <EditForm key={data.id} webhook={data} backTo={backTo} />;
  }

  return (
    <section>
      <Link to={backTo} className="back">
        ← Back to webhooks
      </Link>
      {content}
    </section>
  );
}

function EditForm({ webhook, backTo }: { webhook: Webhook; backTo: string }) {
  const navigate = useNavigate();
  const update = useUpdateWebhook(webhook.id);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { name: webhook.name, url: webhook.url },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      navigate(backTo);
    } catch (error) {
      setServerErrors(error, setError, webhookSchema.keyof().options);
    }
  });

  return (
    <form className="card form" onSubmit={onSubmit} noValidate>
      <h1>Edit webhook</h1>

      <label className="field">
        <span>Name</span>
        <input {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <small className="error">{errors.name.message}</small>}
      </label>

      <label className="field">
        <span>URL</span>
        <input type="url" inputMode="url" {...register('url')} aria-invalid={!!errors.url} />
        {errors.url && <small className="error">{errors.url.message}</small>}
      </label>

      {errors.root?.server && <p className="error">{errors.root.server.message}</p>}

      <div className="actions">
        <button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <Link to={backTo}>Cancel</Link>
      </div>
    </form>
  );
}
