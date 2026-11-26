import type { Meta, StoryObj } from '@storybook/react-vite';

import { clinicalCasesMock } from '@/shared/mocks/clinicalCases.mock';
import { ClinicalCaseRow } from './ClinicalCaseRow';

const [approved, dismissed, noCase] = clinicalCasesMock;

const meta = {
  title: 'Atoms/ClinicalCaseRow',
  component: ClinicalCaseRow,
  args: {
    ...approved,
    name: 'clinical-case',
    checked: false,
    onSelect: () => {},
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['approved', 'dismissed', 'noCase'],
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
} satisfies Meta<typeof ClinicalCaseRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Approved: Story = {};

export const Selected: Story = {
  args: { checked: true },
};

export const Dismissed: Story = {
  args: dismissed,
};

export const NoCase: Story = {
  args: noCase,
};

export const NoLabTests: Story = {
  args: { ...noCase, labTestsCount: 0 },
};
