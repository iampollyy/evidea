import type { Meta, StoryObj } from '@storybook/react-vite';

import { clinicalCasesMock } from '@/shared/mocks/clinicalCases.mock';
import { DiagnosticAnalysis } from './DiagnosticAnalysis';

const meta = {
  title: 'Organisms/DiagnosticAnalysis',
  component: DiagnosticAnalysis,
  args: {
    cases: clinicalCasesMock,
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DiagnosticAnalysis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoCases: Story = {
  args: {
    cases: [],
  },
};
