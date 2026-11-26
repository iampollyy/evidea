import type { Meta, StoryObj } from '@storybook/react-vite';

import { labResultsMock } from '@/shared/mocks/labResults.mock';
import { LabResultRow } from './LabResultRow';

const [cbc, , geneticPanel, , eeg] = labResultsMock;

const meta = {
  title: 'Atoms/LabResultRow',
  component: LabResultRow,
  args: geneticPanel,
  argTypes: {
    status: {
      control: 'select',
      options: ['completed', 'pending', 'notAvailable'],
    },
  },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0 }}>
        <Story />
      </ul>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof LabResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const FlaggedExpanded: Story = {
  args: { ...cbc, defaultExpanded: true },
};

export const NotAvailable: Story = {
  args: eeg,
};
