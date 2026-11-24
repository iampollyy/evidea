import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type MouseEvent } from 'react';
import { fn } from 'storybook/test';

import { clinicianUserMock } from '@/shared/mocks/currentUser.mock';
import { doctorNavItemsMock } from '@/shared/mocks/doctorNav.mock';
import { patientsMock } from '@/shared/mocks/patients.mock';
import type { PatientsGridPatient } from '@/shared/ui/components/PatientsGrid/PatientsGrid';
import type { LayoutOption } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';
import { WorkspaceLayout } from '@/shared/ui/organisms/WorkspaceLayout/WorkspaceLayout';
import { INITIAL_FILTERS } from '@/constants/doctorDashboard.constants';
import type { PatientFilters } from '@/shared/types/doctorDashboard.types';
import { DoctorDashboard } from './DoctorDashboard';

const meta = {
  title: 'Organisms/DoctorDashboard',
  component: DoctorDashboard,
  args: {
    patients: patientsMock,
    filters: INITIAL_FILTERS,
    layout: 'grid',
    totalPages: 1,
    totalItems: 565,
    onRetry: fn(),
    onFiltersChange: fn(),
    onLayoutChange: fn(),
    onAddPatientOpen: fn(),
    onAddPatientCancel: fn(),
    onAddPatientSubmit: fn(),
    getPatientHref: (patient) => `/doctor/patients/${patient.id}/overview`,
    onPatientOpen: fn((_patient: PatientsGridPatient, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    ),
  },
  decorators: [
    (Story) => (
      <WorkspaceLayout
        user={clinicianUserMock}
        navItems={doctorNavItemsMock}
        activeNavId={doctorNavItemsMock[0].id}
        homeHref={doctorNavItemsMock[0].href}
        onSignOut={fn()}
      >
        <Story />
      </WorkspaceLayout>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DoctorDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const List: Story = {
  args: {
    layout: 'list',
  },
};

export const Interactive: Story = {
  render: function InteractiveDoctorDashboard(args) {
    const [filters, setFilters] = useState<PatientFilters>(args.filters);
    const [layout, setLayout] = useState<LayoutOption>(args.layout);
    const query = filters.search.trim().toLowerCase();
    const patients =
      query.length >= 2
        ? args.patients.filter((patient) => patient.name.toLowerCase().includes(query))
        : args.patients;

    return (
      <DoctorDashboard
        {...args}
        patients={patients}
        totalItems={patients.length}
        filters={filters}
        layout={layout}
        onFiltersChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onLayoutChange={setLayout}
      />
    );
  },
};

export const Loading: Story = {
  args: {
    patients: [],
    totalItems: 0,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    patients: [],
    totalItems: 0,
  },
};

export const NoSearchResults: Story = {
  args: {
    patients: [],
    totalItems: 0,
    filters: { ...INITIAL_FILTERS, search: 'Zebediah' },
  },
};

export const Error: Story = {
  args: {
    error: 'Unable to load patients: HTTP 503',
  },
};

export const WithPagination: Story = {
  args: {
    totalPages: 38,
    filters: { ...INITIAL_FILTERS, page: 2 },
  },
};

export const AddPatient: Story = {
  args: {
    isAddPatientOpen: true,
  },
};
