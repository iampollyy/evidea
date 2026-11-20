import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../Icon/Icon';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    children: 'New Patient',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    icon: {
      control: false,
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    icon: <Icon name="add" />,
  },
};

export const PrimaryWithoutIcon: Story = {
  args: {
    icon: undefined,
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    icon: <Icon name="add" />,
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const IconOnly: Story = {
  args: {
    children: undefined,
    icon: <Icon name="add" />,
    'aria-label': 'Add patient',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
