import { AppRoutes } from '@/routes/AppRoutes';
import { useSessionCheck } from '@/shared/hooks/useSessionCheck';

export function App() {
  useSessionCheck();

  return <AppRoutes />;
}
