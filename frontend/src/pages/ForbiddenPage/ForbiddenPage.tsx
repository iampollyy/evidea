import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function ForbiddenPage() {
  useDocumentTitle(PAGE_TITLES.forbidden);

  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
    </main>
  );
}
