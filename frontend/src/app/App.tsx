import { SessionProvider } from '@/context/SessionProvider';
import { AppRoutes } from '@/routes/AppRoutes';

export function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}
