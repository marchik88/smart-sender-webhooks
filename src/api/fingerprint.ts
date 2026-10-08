const STORAGE_KEY = 'device_fingerprint';

function generate() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getFingerprint(): string {
  let fingerprint = localStorage.getItem(STORAGE_KEY);
  if (!fingerprint) {
    fingerprint = generate();
    localStorage.setItem(STORAGE_KEY, fingerprint);
  }
  return fingerprint;
}
