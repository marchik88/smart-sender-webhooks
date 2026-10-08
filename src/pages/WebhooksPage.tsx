import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import type { Webhook } from '../api/types';
import { Spinner } from '../components/Spinner';
import { Pagination } from '../webhooks/Pagination';
import { useWebhookList } from '../webhooks/queries';
import { SearchInput } from '../webhooks/SearchInput';

export function WebhooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const search = searchParams.get('search') ?? '';

  const pageParams = (next: number): Record<string, string> =>
    search ? { search, page: String(next) } : { page: String(next) };
  const setPage = (next: number) => setSearchParams(pageParams(next));
  const setSearch = (next: string) => setSearchParams(next.trim() ? { search: next.trim() } : {});

  const { data, error, isPending, isError, isPlaceholderData, refetch } = useWebhookList({
    page,
    search,
  });

  const last = data?.paging.pages.last;
  if (last !== undefined && !isPlaceholderData && page > last) {
    return <Navigate to={{ search: `?${new URLSearchParams(pageParams(last))}` }} replace />;
  }

  return (
    <section>
      <header className="toolbar">
        <h1>Webhooks</h1>
        <SearchInput value={search} onChange={setSearch} />
      </header>

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <div className="state">
          <p className="error">Could not load webhooks: {error.message}</p>
          <button type="button" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : data.data.length === 0 ? (
        <div className="state">
          {search ? (
            <>
              <p>Nothing found for "{search}".</p>
              <button type="button" onClick={() => setSearch('')}>
                Clear search
              </button>
            </>
          ) : (
            <p>No webhooks yet.</p>
          )}
        </div>
      ) : (
        <>
          <WebhookTable webhooks={data.data} dimmed={isPlaceholderData} />
          <Pagination
            page={data.paging.pages.current}
            last={data.paging.pages.last}
            total={data.paging.results.total}
            onChange={setPage}
          />
        </>
      )}
    </section>
  );
}

function WebhookTable({ webhooks, dimmed }: { webhooks: Webhook[]; dimmed: boolean }) {
  const location = useLocation();

  return (
    <table className="table" aria-busy={dimmed} data-dimmed={dimmed}>
      <thead>
        <tr>
          <th>Name</th>
          <th>URL</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {webhooks.map((webhook) => (
          <tr key={webhook.id}>
            <td>
              <Link to={`/webhooks/${webhook.id}`} state={{ from: location.search }}>
                {webhook.name}
              </Link>
            </td>
            <td className="url">{webhook.url}</td>
            <td>
              <span className={webhook.active ? 'badge on' : 'badge'}>
                {webhook.active ? 'Active' : 'Inactive'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
