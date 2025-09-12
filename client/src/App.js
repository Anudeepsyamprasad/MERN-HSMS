import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Patients/Patients';
import Doctors from './components/Doctors/Doctors';
import Appointments from './components/Appointments/Appointments';
import MedicalRecords from './components/MedicalRecords/MedicalRecords';
import Users from './components/Users/Users';
import Profile from './components/Profile/Profile';
import LoadingSpinner from './components/UI/LoadingSpinner';
import './form-styles.css';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <DashboardProvider>
        <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Patient and Doctor routes */}
          <Route
            path="patients"
            element={
              <PrivateRoute allowedRoles={['admin', 'doctor']}>
                <Patients />
              </PrivateRoute>
            }
          />
          
          {/* Admin, Doctor, and Patient routes */}
          <Route
            path="doctors"
            element={
              <PrivateRoute allowedRoles={['admin', 'doctor', 'patient']}>
                <Doctors />
              </PrivateRoute>
            }
          />
          
          {/* All authenticated users */}
          <Route path="appointments" element={<Appointments />} />
          <Route path="medical-records" element={<MedicalRecords />} />
          
          {/* Admin only routes */}
          <Route
            path="users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Users />
              </PrivateRoute>
            }
          />
          
          {/* All authenticated users */}
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </DashboardProvider>
    </div>
  );
}

export default App;

