import { useLocation, useNavigate, type Location } from 'react-router-dom';

import { LoginPage } from '@/shared/ui/pages/LoginPage/LoginPage';

export function LoginRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as
    | { from?: Pick<Location, 'pathname' | 'search' | 'hash'> }
    | null;

  const handleLoginSuccess = () => {
    const from = state?.from;
    navigate(from ? `${from.pathname}${from.search}${from.hash}` : '/', { replace: true });
  };

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export function ProtectedHomePage() {
  return (
    <main>
      <h1>EVIDEA</h1>
      <p>You are signed in.</p>
    </main>
  );
}
