import type { ReactNode } from 'react';

import { useSessionCheck } from '@/shared/hooks/useSessionCheck';

export function SessionCheck({ children }: { children: ReactNode }) {
  useSessionCheck();
  return children;
}
