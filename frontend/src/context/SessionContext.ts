import { createContext } from 'react';

import type { SessionContextValue } from '@/shared/types/session.types';

export const SessionContext = createContext<SessionContextValue | null>(null);
