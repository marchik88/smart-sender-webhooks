type Props = {
  page: number;
  last: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, last, total, onChange }: Props) {
  if (last <= 1) return <p className="muted">Total: {total}</p>;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span>
        Page {page} of {last} · {total} total
      </span>
      <button type="button" disabled={page >= last} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </nav>
  );
}
