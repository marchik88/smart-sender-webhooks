import '@tanstack/react-query';
import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipSessionRefresh?: boolean;
    csrfRetried?: boolean;
    sessionRetried?: boolean;
    sessionGeneration?: number;
  }
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { successTitle?: string };
  }
}
