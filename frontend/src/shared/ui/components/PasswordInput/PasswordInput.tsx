import { useState } from 'react';

import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Input, type InputProps } from '@/shared/ui/atoms/Input/Input';
import styles from './PasswordInput.module.scss';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>;

export function PasswordInput({ disabled, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      type={visible ? 'text' : 'password'}
      disabled={disabled}
      trailing={
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={visible ? 'visibility' : 'visibility_off'} />}
          aria-label="Show password"
          aria-pressed={visible}
          disabled={disabled}
          className={styles.toggle}
          onClick={() => setVisible((value) => !value)}
        />
      }
      {...rest}
    />
  );
}
