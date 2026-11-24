import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { DEFAULT_PATIENT_PROFILE_TAB } from '@/constants/patientProfile.constants';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DoctorDashboardPage } from '@/pages/DoctorDashboardPage/DoctorDashboardPage';
import { HomePage } from '@/pages/HomePage/HomePage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { PatientProfilePage } from '@/pages/PatientProfilePage/PatientProfilePage';
import { SetPasswordPage } from '@/pages/SetPasswordPage/SetPasswordPage';
import type { CurrentUser } from '@/types/auth.types';
import type { LoginLocationState } from '@/types/routes.types';
import { isPatientProfileTab } from '@/utils/patientProfile';
import { HOME_PATH_BY_ROLE, patientProfilePath, ROUTES } from './paths';

export function LoginRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as LoginLocationState)?.from;

  const handleLoginSuccess = (user: CurrentUser) => {
    const target = from
      ? `${from.pathname}${from.search}${from.hash}`
      : HOME_PATH_BY_ROLE[user.role];
    navigate(target, { replace: true });
  };

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export function AcceptInvitationRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() || null;

  return (
    <SetPasswordPage token={token} onGoToLogin={() => navigate(ROUTES.login, { replace: true })} />
  );
}

export function HomeRoute() {
  const user = useCurrentUser();
  const homePath = HOME_PATH_BY_ROLE[user.role];

  if (homePath !== ROUTES.home) {
    return <Navigate to={homePath} replace />;
  }

  return <HomePage />;
}

export function DoctorDashboardRoute() {
  const navigate = useNavigate();

  return (
    <DoctorDashboardPage
      getPatientHref={(patient) => patientProfilePath(patient.id)}
      onPatientOpen={(patient, event) => {
        event.preventDefault();
        navigate(patientProfilePath(patient.id));
      }}
    />
  );
}

export function PatientProfileRoute() {
  const { patientId = '', tab } = useParams();
  const navigate = useNavigate();

  if (!isPatientProfileTab(tab)) {
    return <Navigate to={patientProfilePath(patientId, DEFAULT_PATIENT_PROFILE_TAB)} replace />;
  }

  return (
    <PatientProfilePage
      key={patientId}
      patientId={patientId}
      activeTab={tab}
      getTabHref={(nextTab) => patientProfilePath(patientId, nextTab)}
      onTabNavigate={(nextTab, event) => {
        event.preventDefault();
        navigate(patientProfilePath(patientId, nextTab));
      }}
      backHref={ROUTES.doctor.dashboard}
      onBack={(event) => {
        event.preventDefault();
        navigate(ROUTES.doctor.dashboard);
      }}
    />
  );
}
