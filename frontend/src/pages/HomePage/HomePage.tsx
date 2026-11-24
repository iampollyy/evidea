import { PAGE_TITLES } from '@/constants/pageTitles.constants';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle(PAGE_TITLES.home);

  return (
    <main>
      <h1>EVIDEA</h1>
      <p>You are signed in.</p>
    </main>
  );
}
