import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../Icon/Icon';
import { Badge, type BadgeVariant } from './Badge';

const variants: BadgeVariant[] = ['brand', 'neutral', 'success', 'info', 'warning', 'error'];

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: {
    children: 'Total Patients : 565',
    variant: 'brand',
    size: 'md',
    inverse: false,
    pill: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
    icon: {
      control: false,
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inverse: Story = {
  args: {
    inverse: true,
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Icon name="group" />,
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      {variants.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const InverseVariants: Story = {
  args: {
    inverse: true,
  },
  render: Variants.render,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Badge {...args} size="sm">
        Small
      </Badge>
      <Badge {...args} size="md">
        Medium
      </Badge>
      <Badge {...args} size="lg">
        Large
      </Badge>
    </div>
  ),
};

export const Pill: Story = {
  args: {
    children: 'Active patient',
    variant: 'success',
    size: 'sm',
    pill: true,
  },
};
