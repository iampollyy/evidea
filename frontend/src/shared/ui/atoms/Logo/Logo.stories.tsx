import type { Meta, StoryObj } from '@storybook/react-vite';

import { Logo } from './Logo';

const meta = {
  title: 'Atoms/Logo',
  component: Logo,
  tags: ['autodocs'],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutTagline: Story = {
  args: { tagline: null },
};

export const AsLink: Story = {
  args: { href: '/' },
};

export const InverseLarge: Story = {
  args: { tone: 'inverse', size: 'lg', tagline: null },
  decorators: [
    (Story) => (
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--ev-color-brand)' }}>
        <Story />
      </div>
    ),
  ],
};
