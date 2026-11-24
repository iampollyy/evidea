import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type MouseEvent } from 'react';
import { fn } from 'storybook/test';

import { PatientProfileNav, type PatientProfileNavItem } from './PatientProfileNav';

const items: PatientProfileNavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview' },
  { id: 'anamnesis', label: 'Anamnesis', href: '#anamnesis' },
  { id: 'laboratory-tests', label: 'Laboratory Tests', href: '#laboratory-tests' },
  { id: 'diagnostics', label: 'Diagnostic Analysis', href: '#diagnostics' },
  { id: 'clinical-history', label: 'Clinical History', href: '#clinical-history' },
];

const meta = {
  title: 'Components/PatientProfileNav',
  component: PatientProfileNav,
  args: {
    items,
    activeId: 'overview',
    onNavigate: fn((_item: PatientProfileNavItem, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    ),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PatientProfileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: function InteractivePatientProfileNav(args) {
    const [activeId, setActiveId] = useState(args.activeId);

    return (
      <PatientProfileNav
        {...args}
        activeId={activeId}
        onNavigate={(item, event) => {
          event.preventDefault();
          setActiveId(item.id);
        }}
      />
    );
  },
};
