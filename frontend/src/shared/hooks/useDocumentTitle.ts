import { useEffect } from 'react';

import { APP_TITLE } from '@/constants/pageTitles.constants';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${APP_TITLE}`;
  }, [title]);
}
