import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import requestThrottle from '../../utils/requestThrottle';
import './Dashboard.css';
import {
  FaUsers,
  FaUserMd,
  FaCalendarAlt,
  FaFileMedical,
  FaClock,
  FaCheckCircle,
  FaPlus,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaUserCog,
  FaHospital,
  FaArrowRight,
  FaEye,
  FaEdit,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { refreshTrigger } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [hasMedicalRecords, setHasMedicalRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Throttle dashboard data fetching to prevent rate limiting
        await requestThrottle.throttle('fetchDashboardData', 1000); // 1 second throttle
        
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const statsResponse = await api.get('/api/appointments/stats');
        setStats(statsResponse.data);

        // Fetch recent appointments (all appointments, sorted by most recent first)
        try {
          const appointmentsResponse = await api.get('/api/appointments?limit=5');
          const appointmentsData = appointmentsResponse.data;
          
          // Handle different response structures
          let recentAppointmentsList = [];
          if (Array.isArray(appointmentsData)) {
            recentAppointmentsList = appointmentsData;
          } else if (appointmentsData && Array.isArray(appointmentsData.appointments)) {
            recentAppointmentsList = appointmentsData.appointments;
          } else if (appointmentsData && Array.isArray(appointmentsData.data)) {
            recentAppointmentsList = appointmentsData.data;
          }
          
          console.log('Dashboard - Fetched recent appointments:', recentAppointmentsList);
          console.log('Dashboard - Appointments data structure:', appointmentsData);
          setRecentAppointments(recentAppointmentsList);
        } catch (appointmentsError) {
          console.error('Dashboard - Error fetching recent appointments:', appointmentsError);
          setRecentAppointments([]);
        }

        // Check if patient has medical records
        if (user?.role === 'patient') {
          try {
            const medicalRecordsResponse = await api.get('/api/medical-records');
            const records = Array.isArray(medicalRecordsResponse.data) 
              ? medicalRecordsResponse.data 
              : (medicalRecordsResponse.data.medicalRecords || []);
            setHasMedicalRecords(records.length > 0);
          } catch (error) {
            console.error('Error checking medical records:', error);
            setHasMedicalRecords(false);
          }
        } else {
          setHasMedicalRecords(true); // Admin and doctor always have access
        }
        
        // Update last updated timestamp
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Handle rate limiting errors
        if (error.response?.status === 429) {
          console.warn('Rate limit exceeded for dashboard data');
          // Don't show error to user for dashboard, just use cached data
        } else {
          // Set default values on other errors
          setStats({
            totalPatients: 0,
            totalDoctors: 0,
            totalAppointments: 0,
            todayAppointments: 0,
            upcomingAppointments: 0,
            completedAppointments: 0
          });
          setRecentAppointments([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, refreshKey, refreshTrigger]); // Re-fetch when user changes, refreshKey changes, or global refresh trigger

  // Refresh dashboard when navigating back to it
  useEffect(() => {
    if (location.pathname === '/dashboard' && user) {
      setRefreshKey(prev => prev + 1);
    }
  }, [location.pathname, user]);

  // Auto-refresh dashboard every 10 minutes (reduced frequency to prevent rate limiting)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage the entire hospital system',
          stats: [
            { 
              label: 'Total Patients', 
              value: stats.totalPatients, 
              icon: FaUsers, 
              color: 'bg-primary',
              bgColor: 'bg-light',
              textColor: 'text-primary',
              path: '/patients',
              description: 'Registered patients'
            },
            { 
              label: 'Total Doctors', 
              value: stats.totalDoctors, 
              icon: FaUserMd, 
              color: 'bg-success',
              bgColor: 'bg-light',
              textColor: 'text-success',
              path: '/doctors',
              description: 'Active doctors'
            },
            { 
              label: 'Total Appointments', 
              value: stats.totalAppointments, 
              icon: FaCalendarAlt, 
              color: 'bg-info',
              bgColor: 'bg-light',
              textColor: 'text-info',
              path: '/appointments',
              description: 'All appointments'
            },
            { 
              label: 'Today\'s Appointments', 
              value: stats.todayAppointments, 
              icon: FaClock, 
              color: 'bg-warning',
              bgColor: 'bg-light',
              textColor: 'text-warning',
              path: '/appointments',
              description: 'Scheduled today'
            }
          ],
          quickActions: [
            { label: 'Add Patient', icon: FaUsers, path: '/patients' },
            { label: 'Add Doctor', icon: FaUserMd, path: '/doctors' },
            { label: 'Book Appointment', icon: FaCalendarAlt, path: '/appointments' },
            { label: 'View Records', icon: FaFileMedical, path: '/medical-records' }
          ]
        };
      case 'doctor':
        return {
          title: 'Doctor Dashboard',
          description: 'Manage your patients and appointments',
          stats: [
            { 
              label: 'My Patients', 
              value: stats.totalPatients, 
              icon: FaUsers, 
              color: 'bg-primary',
              bgColor: 'bg-light',
              textColor: 'text-primary',
              path: '/patients',
              description: 'Assigned patients'
            },
            { 
              label: 'Today\'s Appointments', 
              value: stats.todayAppointments, 
              icon: FaCalendarAlt, 
              color: 'bg-warning',
              bgColor: 'bg-light',
              textColor: 'text-warning',
              path: '/appointments',
              description: 'Scheduled today'
            },
            { 
              label: 'Upcoming Appointments', 
              value: stats.upcomingAppointments, 
              icon: FaClock, 
              color: 'bg-info',
              bgColor: 'bg-light',
              textColor: 'text-info',
              path: '/appointments',
              description: 'Next appointments'
            },
            { 
              label: 'Completed Appointments', 
              value: stats.completedAppointments, 
              icon: FaCheckCircle, 
              color: 'bg-success',
              bgColor: 'bg-light',
              textColor: 'text-success',
              path: '/appointments',
              description: 'Finished today'
            }
          ],
          quickActions: [
            { label: 'View Patients', icon: FaUsers, path: '/patients' },
            { label: 'Today\'s Schedule', icon: FaCalendarAlt, path: '/appointments' },
            { label: 'Medical Records', icon: FaFileMedical, path: '/medical-records' },
            { label: 'Profile Settings', icon: FaUserCog, path: '/profile' }
          ]
        };
      case 'patient':
        return {
          title: 'Patient Dashboard',
          description: 'Manage your appointments and medical records',
          stats: [
            { 
              label: 'My Appointments', 
              value: stats.totalAppointments, 
              icon: FaCalendarAlt, 
              color: 'bg-primary',
              bgColor: 'bg-light',
              textColor: 'text-primary',
              path: '/appointments',
              description: 'All your appointments'
            },
            { 
              label: 'Available Doctors', 
              value: stats.totalDoctors, 
              icon: FaUserMd, 
              color: 'bg-success',
              bgColor: 'bg-light',
              textColor: 'text-success',
              path: '/doctors',
              description: 'Doctors you can book with'
            },
            { 
              label: 'Today\'s Appointments', 
              value: stats.todayAppointments, 
              icon: FaClock, 
              color: 'bg-warning',
              bgColor: 'bg-light',
              textColor: 'text-warning',
              path: '/appointments',
              description: 'Your appointments today'
            },
            { 
              label: 'Upcoming Appointments', 
              value: stats.upcomingAppointments, 
              icon: FaCalendarAlt, 
              color: 'bg-info',
              bgColor: 'bg-light',
              textColor: 'text-info',
              path: '/appointments',
              description: 'Future appointments'
            }
          ],
          quickActions: [
            { label: 'Book Appointment', icon: FaCalendarAlt, path: '/appointments' },
            { label: 'View Doctors', icon: FaUserMd, path: '/doctors' },
            ...(hasMedicalRecords ? [{ label: 'My Records', icon: FaFileMedical, path: '/medical-records' }] : []),
            { label: 'Profile Settings', icon: FaUserCog, path: '/profile' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to the hospital management system',
          stats: [
            { 
              label: 'Total Patients', 
              value: stats.totalPatients, 
              icon: FaUsers, 
              color: 'bg-primary',
              bgColor: 'bg-light',
              textColor: 'text-primary',
              path: '/patients',
              description: 'Registered patients'
            },
            { 
              label: 'Total Doctors', 
              value: stats.totalDoctors, 
              icon: FaUserMd, 
              color: 'bg-success',
              bgColor: 'bg-light',
              textColor: 'text-success',
              path: '/doctors',
              description: 'Active doctors'
            },
            { 
              label: 'Total Appointments', 
              value: stats.totalAppointments, 
              icon: FaCalendarAlt, 
              color: 'bg-info',
              bgColor: 'bg-light',
              textColor: 'text-info',
              path: '/appointments',
              description: 'All appointments'
            },
            { 
              label: 'Today\'s Appointments', 
              value: stats.todayAppointments, 
              icon: FaClock, 
              color: 'bg-warning',
              bgColor: 'bg-light',
              textColor: 'text-warning',
              path: '/appointments',
              description: 'Scheduled today'
            }
          ],
          quickActions: [
            { label: 'View Patients', icon: FaUsers, path: '/patients' },
            { label: 'View Doctors', icon: FaUserMd, path: '/doctors' },
            { label: 'View Appointments', icon: FaCalendarAlt, path: '/appointments' },
            { label: 'Medical Records', icon: FaFileMedical, path: '/medical-records' }
          ]
        };
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge bg-success';
      case 'scheduled':
        return 'badge bg-primary';
      case 'cancelled':
        return 'badge bg-danger';
      case 'pending':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  };

  const content = getRoleBasedContent();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container-fluid px-4">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between py-4">
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center dashboard-icon bg-primary rounded shadow me-3">
                <FaHospital className="text-white" />
              </div>
              <div>
                <h1 className="display-6 fw-bold text-dark mb-1">{content.title}</h1>
                <p className="text-muted mb-0">
                  {getGreeting()}, <span className="fw-semibold text-primary">{user?.username}</span>! {content.description}
                  {lastUpdated && (
                    <span className="ms-2 small text-muted">
                      • Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center mt-3 mt-sm-0">
              <button 
                onClick={handleRefresh}
                className="btn btn-outline-primary d-flex align-items-center me-2"
                disabled={loading}
                title={loading ? 'Refreshing...' : 'Refresh dashboard data'}
              >
                <FaCog className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center me-2">
                <FaBell className="me-2" />
                Notifications
              </button>
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="btn btn-danger d-flex align-items-center"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4 py-5">
        {/* Statistics Grid */}
        <div className="row g-4 mb-5">
          {content.stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="col-12 col-md-6 col-lg-3">
                <div 
                  className="card h-100 border-0 shadow-sm dashboard-stat-card"
                  onClick={() => handleNavigation(stat.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="p-3 rounded bg-light me-3">
                          <Icon className="text-primary" />
                        </div>
                        <div>
                          <p className="small text-muted mb-1">{stat.label}</p>
                          <p className="h4 fw-bold text-dark mb-1">{stat.value}</p>
                          <p className="small text-muted mb-0">{stat.description}</p>
                        </div>
                      </div>
                      <FaArrowRight className="text-muted" />
                    </div>
                    <div className="mt-3 d-flex align-items-center small text-muted">
                      <FaChartLine className="me-1" />
                      <span>+12% from last month</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card border-0 shadow-sm mb-5">
          <div className="card-header bg-white border-bottom">
            <h2 className="h5 fw-semibold text-dark mb-1">Quick Actions</h2>
            <p className="small text-secondary mb-0">Access frequently used features</p>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {content.quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div key={index} className="col-12 col-md-6 col-lg-3">
                    <button
                      onClick={() => handleNavigation(action.path)}
                      className="btn btn-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2 p-4"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="small fw-medium">{action.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card border-0 shadow-sm mb-5">
          <div className="card-header bg-white border-bottom">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 className="h5 fw-semibold text-dark mb-1">
                  {user?.role === 'patient' ? 'My Upcoming Appointments' : 'Recent Appointments'}
                </h2>
                <p className="small text-secondary mb-0">
                  {user?.role === 'patient' ? 'Your scheduled appointments' : 'Latest appointment activities'}
                  {lastUpdated && (
                    <span className="ms-2">
                      • Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleRefresh}
                  title="Refresh recent appointments"
                >
                  <FaCog className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleNavigation('/appointments')}
                >
                  View All
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading recent appointments...</p>
              </div>
            ) : recentAppointments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      {user?.role !== 'patient' && <th>Patient</th>}
                      <th>Doctor</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((appointment, index) => (
                      <tr key={index}>
                        {user?.role !== 'patient' && (
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="h-8 w-8 rounded-circle bg-primary d-flex align-items-center justify-content-center me-3">
                                <span className="text-white small fw-semibold">
                                  {appointment.patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                                </span>
                              </div>
                              <div>
                                <p className="mb-0 fw-medium text-dark">{appointment.patient?.name || 'Unknown Patient'}</p>
                                <p className="mb-0 small text-secondary">{appointment.patient?.contact || 'No contact'}</p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="h-8 w-8 rounded-circle bg-success d-flex align-items-center justify-content-center me-3">
                              <span className="text-white small fw-semibold">
                                {appointment.doctor?.name?.charAt(0)?.toUpperCase() || 'D'}
                              </span>
                            </div>
                            <div>
                              <p className="mb-0 fw-medium text-dark">{appointment.doctor?.name || 'Unknown Doctor'}</p>
                              <p className="mb-0 small text-secondary">{appointment.doctor?.specialization || 'General'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="mb-0 fw-medium text-dark">
                              {new Date(appointment.dateTime).toLocaleDateString()}
                            </p>
                            <p className="mb-0 small text-secondary">
                              {new Date(appointment.dateTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusBadgeColor(appointment.status)}>
                            {appointment.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm" title="View">
                              <FaEye className="h-4 w-4" />
                            </button>
                            {user?.role !== 'patient' && (
                              <button className="btn btn-outline-secondary btn-sm" title="Edit">
                                <FaEdit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <FaCalendarAlt className="h-12 w-12 text-secondary mb-3" />
                <h5 className="text-secondary">
                  {user?.role === 'patient' ? 'No upcoming appointments' : 'No recent appointments'}
                </h5>
                <p className="text-secondary mb-0">
                  {user?.role === 'patient' 
                    ? 'Book an appointment to get started' 
                    : 'Appointments will appear here once scheduled'
                  }
                </p>
                {user?.role === 'patient' && (
                  <button 
                    className="btn btn-primary mt-3"
                    onClick={() => handleNavigation('/appointments')}
                  >
                    <FaPlus className="me-2" />
                    Book Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Status - Only show for admin and doctor */}
        {user?.role !== 'patient' && (
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h2 className="h5 fw-semibold text-dark mb-1">System Status</h2>
                  <p className="small text-secondary mb-0">Current system performance and health</p>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                        <div className="d-flex align-items-center">
                          <div className="h-8 w-8 rounded-circle bg-success d-flex align-items-center justify-content-center me-3">
                            <FaCheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="mb-0 fw-medium text-dark">Database</p>
                            <p className="mb-0 small text-success">Online</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                        <div className="d-flex align-items-center">
                          <div className="h-8 w-8 rounded-circle bg-success d-flex align-items-center justify-content-center me-3">
                            <FaCheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="mb-0 fw-medium text-dark">API Server</p>
                            <p className="mb-0 small text-success">Running</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                        <div className="d-flex align-items-center">
                          <div className="h-8 w-8 rounded-circle bg-warning d-flex align-items-center justify-content-center me-3">
                            <FaExclamationTriangle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="mb-0 fw-medium text-dark">Backup System</p>
                            <p className="mb-0 small text-warning">Pending</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                        <div className="d-flex align-items-center">
                          <div className="h-8 w-8 rounded-circle bg-info d-flex align-items-center justify-content-center me-3">
                            <FaInfoCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="mb-0 fw-medium text-dark">Security</p>
                            <p className="mb-0 small text-info">Protected</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h2 className="h5 fw-semibold text-dark mb-1">Recent Activity</h2>
                  <p className="small text-secondary mb-0">Latest system activities</p>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div className="h-6 w-6 rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0 mt-1">
                        <FaUsers className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 small fw-medium text-dark">New patient registered</p>
                        <p className="mb-0 small text-secondary">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-3">
                      <div className="h-6 w-6 rounded-circle bg-success d-flex align-items-center justify-content-center flex-shrink-0 mt-1">
                        <FaCalendarAlt className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 small fw-medium text-dark">Appointment scheduled</p>
                        <p className="mb-0 small text-secondary">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-3">
                      <div className="h-6 w-6 rounded-circle bg-info d-flex align-items-center justify-content-center flex-shrink-0 mt-1">
                        <FaUserMd className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 small fw-medium text-dark">Doctor updated profile</p>
                        <p className="mb-0 small text-secondary">10 minutes ago</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-3">
                      <div className="h-6 w-6 rounded-circle bg-warning d-flex align-items-center justify-content-center flex-shrink-0 mt-1">
                        <FaFileMedical className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 small fw-medium text-dark">Medical record updated</p>
                        <p className="mb-0 small text-secondary">15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowLogoutModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to logout?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
