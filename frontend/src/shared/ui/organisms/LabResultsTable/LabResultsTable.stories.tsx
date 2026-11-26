import type { Meta, StoryObj } from '@storybook/react-vite';

import { labResultsMock } from '@/shared/mocks/labResults.mock';
import { LabResultsTable } from './LabResultsTable';

const meta = {
  title: 'Organisms/LabResultsTable',
  component: LabResultsTable,
  args: {
    results: labResultsMock,
    expandedResultId: 'cbc',
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LabResultsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: {
    expandedResultId: undefined,
  },
};

export const Empty: Story = {
  args: {
    results: [],
  },
};
