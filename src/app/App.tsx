import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { AuthProvider } from '../auth/AuthProvider';
import { RequireAuth } from '../auth/RequireAuth';
import { LoginPage } from '../pages/LoginPage';
import { WebhookEditPage } from '../pages/WebhookEditPage';
import { WebhooksPage } from '../pages/WebhooksPage';
import { Toaster } from '../toast/Toaster';
import { Layout } from './Layout';
import { queryClient } from './queryClient';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { path: '/webhooks', element: <WebhooksPage /> },
      { path: '/webhooks/:id', element: <WebhookEditPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/webhooks" replace /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
