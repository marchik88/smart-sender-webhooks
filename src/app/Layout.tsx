import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { useAuth, useCurrentUser } from '../auth/AuthProvider';

export function Layout() {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = () => {
    setSigningOut(true);
    signOut();
  };

  return (
    <>
      <header className="topbar">
        <Link to="/webhooks" className="brand">
          Smart Sender
        </Link>
        <div className="user">
          <span>{user.name}</span>
          <button type="button" onClick={onSignOut} disabled={signingOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
