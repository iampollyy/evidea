import type { Meta, StoryObj } from '@storybook/react-vite';

import { SourceTag } from './SourceTag';

const meta = {
  title: 'Atoms/SourceTag',
  component: SourceTag,
  args: {
    source: 'clinical',
  },
  argTypes: {
    source: {
      control: 'select',
      options: ['clinical', 'laboratory'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SourceTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clinical: Story = {};

export const Laboratory: Story = {
  args: {
    source: 'laboratory',
  },
};
