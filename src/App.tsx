import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';

const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const CommunitiesAdminPage = lazy(() => import('./pages/CommunitiesAdminPage'));
const AnnouncementsAdminPage = lazy(() => import('./pages/AnnouncementsAdminPage'));
const UsersAdminPage = lazy(() => import('./pages/UsersAdminPage'));
const EventsAdminPage = lazy(() => import('./pages/EventsAdminPage'));
const PushNotificationsPage = lazy(() => import('./pages/PushNotificationsPage'));
const CategoriesAdminPage = lazy(() => import('./pages/CategoriesAdminPage'));
const FilesAdminPage = lazy(() => import('./pages/FilesAdminPage'));
const SystemLogsPage = lazy(() => import('./pages/SystemLogsPage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));
const ActiveSessionsPage = lazy(() => import('./pages/ActiveSessionsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const NotificationsListPage = lazy(() => import('./pages/NotificationsListPage'));

function PageFallback() {
  return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin h-10 w-10 text-[#E30613]" />
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('sksAdminToken');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return (
    <DashboardLayout>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </DashboardLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/dashboard/communities" element={<ProtectedRoute><CommunitiesAdminPage /></ProtectedRoute>} />
        <Route path="/dashboard/announcements" element={<ProtectedRoute><AnnouncementsAdminPage /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute><UsersAdminPage /></ProtectedRoute>} />

        {/* Faz 2 */}
        <Route path="/dashboard/events" element={<ProtectedRoute><EventsAdminPage /></ProtectedRoute>} />
        <Route path="/dashboard/notifications/send" element={<ProtectedRoute><PushNotificationsPage /></ProtectedRoute>} />

        {/* Faz 3 */}
        <Route path="/dashboard/categories" element={<ProtectedRoute><CategoriesAdminPage /></ProtectedRoute>} />

        {/* Faz 4 */}
        <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsListPage /></ProtectedRoute>} />
        <Route path="/dashboard/files" element={<ProtectedRoute><FilesAdminPage /></ProtectedRoute>} />
        <Route path="/dashboard/logs" element={<ProtectedRoute><SystemLogsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings/sessions" element={<ProtectedRoute><ActiveSessionsPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
