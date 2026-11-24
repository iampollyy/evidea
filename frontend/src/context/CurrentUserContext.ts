import { createContext } from 'react';

import type { CurrentUser } from '@/types/auth.types';

export const CurrentUserContext = createContext<CurrentUser | null>(null);
