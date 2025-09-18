import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { filterNavigationByRole } from '../../utils/rbac';
import './Layout.css';
import {
  FaHome,
  FaUsers,
  FaUserMd,
  FaCalendarAlt,
  FaFileMedical,
  FaUserCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHospital,
  FaBell,
  FaSearch
} from 'react-icons/fa';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FaHome },
    { name: 'Patients', href: '/patients', icon: FaUsers, roles: ['admin', 'doctor'] },
    { name: 'Doctors', href: '/doctors', icon: FaUserMd },
    { name: 'Appointments', href: '/appointments', icon: FaCalendarAlt },
    { name: 'Medical Records', href: '/medical-records', icon: FaFileMedical },
    { name: 'Users', href: '/users', icon: FaUserCog, roles: ['admin'] },
  ];

  const filteredNavigation = filterNavigationByRole(navigation, user?.role);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-vh-100 bg-light layout-container">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-xl-none"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`position-fixed top-0 start-0 bg-white shadow-lg sidebar-desktop ${
          sidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
        style={{ width: '256px', height: '100vh', zIndex: 1050 }}
      >
        {/* Sidebar Header - Fixed */}
        <div className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white flex-shrink-0" style={{ height: '64px' }}>
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center justify-content-center bg-primary rounded me-3" style={{ width: '40px', height: '40px' }}>
              <FaHospital className="text-white" />
            </div>
            <span className="fs-4 fw-bold text-primary">HMS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="d-xl-none btn btn-outline-secondary btn-sm"
          >
            <FaTimes />
          </button>
        </div>

        {/* Sidebar Content - Scrollable */}
        <div className="d-flex flex-column" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Navigation - Scrollable */}
          <div className="flex-grow-1 overflow-y-auto sidebar-navigation">
            <nav className="mt-4 px-3 pb-4">
              <div className="d-flex flex-column">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`nav-link text-decoration-none p-3 rounded d-flex align-items-center ${
                        isActive(item.href)
                          ? 'bg-primary text-white'
                          : 'text-muted'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="me-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* User section - Fixed at bottom */}
          <div className="sidebar-user-section">
            <div className="sidebar-user-details">
              <div className="sidebar-user-avatar">
                <span>
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{user?.username}</p>
                <p className="sidebar-user-role">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline-secondary btn-sm ms-2"
                title="Logout"
                style={{ flexShrink: 0 }}
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="d-xl-block d-none main-content-wrapper">
        {/* Top bar */}
        <div className="position-sticky top-0 bg-white shadow-sm border-bottom" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center justify-content-between px-4" style={{ height: '64px' }}>
            <div className="d-flex align-items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="d-xl-none btn btn-outline-secondary btn-sm"
              >
                <FaBars className="h-6 w-6" />
              </button>
              
              <div className="ms-4 ms-xl-0">
                <h1 className="h5 fw-semibold text-dark mb-0">
                  {filteredNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Search */}
              <div className="d-none d-md-block position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3 d-flex align-items-center">
                  <FaSearch className="h-4 w-4 text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="form-control ps-5 pe-4 py-2 border border-secondary rounded-3"
                />
              </div>

              {/* Notifications */}
              <button className="btn btn-outline-secondary btn-sm position-relative">
                <FaBell className="h-5 w-5" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}></span>
              </button>

              {/* User menu */}
              <div className="d-none d-sm-block">
                <div className="small text-secondary">
                  Welcome back, <span className="fw-medium text-dark">{user?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-0 main-content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="d-xl-none">
        {/* Mobile Top Bar */}
        <div className="position-sticky top-0 z-10 bg-white shadow-sm border-bottom border-secondary-200">
          <div className="d-flex align-items-center justify-content-between h-16 px-4">
            <div className="d-flex align-items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn btn-outline-secondary btn-sm"
              >
                <FaBars className="h-6 w-6" />
              </button>
              
              <div className="ms-3">
                <h1 className="h5 fw-semibold text-dark mb-0">
                  {filteredNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Notifications */}
              <button className="btn btn-outline-secondary btn-sm position-relative">
                <FaBell className="h-5 w-5" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}></span>
              </button>

              {/* User menu */}
              <div className="d-none d-sm-block">
                <div className="small text-secondary">
                  <span className="fw-medium text-dark">{user?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Page content */}
        <main className="p-0 main-content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
