import type { Meta, StoryObj } from '@storybook/react-vite';

import { DisclaimerBanner } from './DisclaimerBanner';

const meta = {
  title: 'Components/DisclaimerBanner',
  component: DisclaimerBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DisclaimerBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
