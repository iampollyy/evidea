import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { adminNavItemsMock } from '@/mocks/adminNav.mock';
import { adminUserMock } from '@/mocks/currentUser.mock';
import { doctorMetricsMock, doctorsMock } from '@/mocks/doctors.mock';
import { WorkspaceLayout } from '@/ui/organisms/WorkspaceLayout/WorkspaceLayout';
import { INITIAL_FILTERS } from '@/constants/adminDashboard.constants';
import { AdminDashboard } from './AdminDashboard';

const meta = {
  title: 'Organisms/AdminDashboard',
  component: AdminDashboard,
  args: {
    metrics: doctorMetricsMock,
    doctors: doctorsMock,
    filters: INITIAL_FILTERS,
    totalPages: 5,
    totalItems: doctorMetricsMock.all,
    onRetry: fn(),
    onFiltersChange: fn(),
    onAddDoctorOpen: fn(),
    onAddDoctorCancel: fn(),
    onAddDoctorSubmit: fn(),
    onDoctorAction: fn(),
  },
  decorators: [
    (Story) => (
      <WorkspaceLayout
        user={adminUserMock}
        navItems={adminNavItemsMock}
        activeNavId={adminNavItemsMock[0].id}
        homeHref={adminNavItemsMock[0].href}
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
} satisfies Meta<typeof AdminDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    metrics: null,
    doctors: [],
    totalItems: 0,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    doctors: [],
    totalItems: 0,
    totalPages: 1,
  },
};

export const Error: Story = {
  args: {
    error: 'Unable to load doctors: HTTP 503',
  },
};

export const WithNotice: Story = {
  args: {
    notice: 'Doctor added and invitation sent.',
  },
};

export const AddDoctor: Story = {
  args: {
    isAddDoctorOpen: true,
  },
};
