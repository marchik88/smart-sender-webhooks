export type Toast = {
  id: string;
  title: string;
};

const DURATION_MS = 6000;
const MAX_VISIBLE = 4;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function notify(toast: Omit<Toast, 'id'>) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { ...toast, id }].slice(-MAX_VISIBLE);

  timers.set(
    id,
    setTimeout(() => dismiss(id), DURATION_MS),
  );
  emit();
}

export function dismiss(id: string) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getToasts = () => toasts;
