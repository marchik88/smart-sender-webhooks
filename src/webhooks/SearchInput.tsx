import { useEffect, useState } from 'react';

const DEBOUNCE_MS = 350;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => onChange(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <input
      type="search"
      className="search"
      placeholder="Search by name"
      aria-label="Search by name"
      value={draft}
      onChange={({ target: { value } }) => setDraft(value)}
    />
  );
}
