import { Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { RequireAuth } from './RequireAuth';
import { RequireAdmin } from './RequireAdmin';

import { JobsPage } from '@/features/jobs/JobsPage';
import { JobDetailPage } from '@/features/jobs/JobDetailPage';

import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';

import { ProfilePage } from '@/features/account/ProfilePage';
import { MyApplicationsPage } from '@/features/account/MyApplicationsPage';

import { MyBusinessesPage } from '@/features/businesses/MyBusinessesPage';
import { BusinessNewPage } from '@/features/businesses/BusinessNewPage';
import { BusinessEditPage } from '@/features/businesses/BusinessEditPage';
import { BusinessDashboardPage } from '@/features/businesses/BusinessDashboardPage';
import { BusinessProfilePage } from '@/features/businesses/BusinessProfilePage';

import { JobApplicantsPage } from '@/features/applications/JobApplicantsPage';

import { AdminLayout } from '@/features/admin/AdminLayout';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminBusinessesPage } from '@/features/admin/AdminBusinessesPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminJobsPage } from '@/features/admin/AdminJobsPage';

import { NotFoundPage } from '@/features/misc/ErrorScreens';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="businesses/:id" element={<BusinessProfilePage />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        <Route element={<RequireAuth />}>
          <Route path="account/profile" element={<ProfilePage />} />
          <Route path="account/applications" element={<MyApplicationsPage />} />
          <Route path="businesses" element={<MyBusinessesPage />} />
          <Route path="businesses/new" element={<BusinessNewPage />} />
          <Route path="businesses/:id/edit" element={<BusinessEditPage />} />
          <Route path="businesses/:id/jobs" element={<BusinessDashboardPage />} />
          <Route path="jobs/:jobId/applicants" element={<JobApplicantsPage />} />
        </Route>

        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="businesses" element={<AdminBusinessesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
