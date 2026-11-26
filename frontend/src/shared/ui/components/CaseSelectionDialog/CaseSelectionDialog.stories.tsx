import type { Meta, StoryObj } from '@storybook/react-vite';

import { clinicalCasesMock } from '@/shared/mocks/clinicalCases.mock';
import { CaseSelectionDialog } from './CaseSelectionDialog';

const meta = {
  title: 'Components/CaseSelectionDialog',
  component: CaseSelectionDialog,
  args: {
    cases: clinicalCasesMock,
    onSelect: () => {},
    onClose: () => {},
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CaseSelectionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    cases: [],
  },
};
