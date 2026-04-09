import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import CommunitiesAdminPage from './pages/CommunitiesAdminPage';
import AnnouncementsAdminPage from './pages/AnnouncementsAdminPage';
import UsersAdminPage from './pages/UsersAdminPage';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('sksAdminToken');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />


        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/communities" element={
          <ProtectedRoute>
            <CommunitiesAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/announcements" element={
          <ProtectedRoute>
            <AnnouncementsAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/users" element={
          <ProtectedRoute>
            <UsersAdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
