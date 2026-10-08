import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../auth/AuthProvider';
import { safeRedirect } from '../auth/redirect';
import { Spinner } from '../components/Spinner';
import { setServerErrors } from '../lib/serverErrors';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { state, signIn } = useAuth();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (state.status === 'checking') return <Spinner />;
  if (state.status === 'authenticated') {
    return <Navigate to={safeRedirect(searchParams.get('redirect'))} replace />;
  }

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch (error) {
      setServerErrors(error, setError, schema.keyof().options);
    }
  });

  return (
    <main className="auth">
      <form className="card form" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <small className="error">{errors.email.message}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <small className="error">{errors.password.message}</small>}
        </label>

        {errors.root?.server && <p className="error">{errors.root.server.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
