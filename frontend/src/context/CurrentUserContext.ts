import { createContext } from 'react';

import type { CurrentUser } from '@/shared/types/auth.types';

export const CurrentUserContext = createContext<CurrentUser | null>(null);
