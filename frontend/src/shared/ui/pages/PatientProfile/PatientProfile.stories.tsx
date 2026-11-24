import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';
import { fn } from 'storybook/test';

import { clinicianUserMock } from '@/shared/mocks/currentUser.mock';
import { doctorNavItemsMock } from '@/shared/mocks/doctorNav.mock';
import {
  patientBannerMock,
  personalInfoMock,
  vitalSignsMeasuredAtMock,
  vitalSignsMock,
} from '@/shared/mocks/patientProfile.mock';
import { WorkspaceLayout } from '@/shared/ui/organisms/WorkspaceLayout/WorkspaceLayout';
import { PatientProfile } from './PatientProfile';
import type { PatientProfileTab } from './PatientProfile.constants';

const personalInfo = {
  values: personalInfoMock,
  isEditing: false,
  onEdit: fn(),
  onCancel: fn(),
  onSave: fn(),
};

const meta = {
  title: 'Pages/PatientProfile',
  component: PatientProfile,
  args: {
    activeTab: 'overview',
    getTabHref: (tab: PatientProfileTab) => `#${tab}`,
    onTabNavigate: fn((_tab: PatientProfileTab, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    ),
    backHref: '#patients',
    onBack: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
    patient: patientBannerMock,
    onRetry: fn(),
    personalInfo,
    vitalSigns: {
      vitals: vitalSignsMock,
      measuredAt: vitalSignsMeasuredAtMock,
      isEditing: false,
      onEdit: fn(),
      onCancel: fn(),
      onSave: fn(),
    },
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
} satisfies Meta<typeof PatientProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const EditingPersonalInfo: Story = {
  args: {
    personalInfo: { ...personalInfo, isEditing: true },
  },
};

export const OtherTab: Story = {
  args: {
    activeTab: 'anamnesis',
  },
};

export const Loading: Story = {
  args: {
    patient: null,
    personalInfo: null,
    isLoading: true,
  },
};

export const LoadError: Story = {
  args: {
    patient: null,
    personalInfo: null,
    error: 'Patient not found.',
  },
};
