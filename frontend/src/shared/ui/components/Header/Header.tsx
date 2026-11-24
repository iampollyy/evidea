import type { ComponentPropsWithRef } from 'react';

import { HeaderNav, type HeaderNavProps } from '@/shared/ui/components/HeaderNav/HeaderNav';
import { SearchField, type SearchFieldProps } from '@/shared/ui/components/SearchField/SearchField';
import styles from './Header.module.scss';

export interface HeaderProps extends Omit<ComponentPropsWithRef<'header'>, 'children'> {
  nav: HeaderNavProps;
  search?: SearchFieldProps;
}

export function Header({ nav, search, className, ...rest }: HeaderProps) {
  const classes = [styles.header, className].filter(Boolean).join(' ');

  return (
    <header className={classes} {...rest}>
      {search && (
        <div role="search">
          <SearchField {...search} />
        </div>
      )}
      <HeaderNav {...nav} className={[styles.nav, nav.className].filter(Boolean).join(' ')} />
    </header>
  );
}
