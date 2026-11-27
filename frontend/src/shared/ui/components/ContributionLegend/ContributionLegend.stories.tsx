import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContributionLegend } from './ContributionLegend';

const meta = {
  title: 'Components/ContributionLegend',
  component: ContributionLegend,
  tags: ['autodocs'],
} satisfies Meta<typeof ContributionLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
