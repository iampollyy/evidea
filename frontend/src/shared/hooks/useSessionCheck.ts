import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';
import { checkSession } from '@/store/sessionSlice';

export function useSessionCheck() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const check = dispatch(checkSession());
    return () => check.abort();
  }, [dispatch]);
}
