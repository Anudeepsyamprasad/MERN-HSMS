import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import LoadingSpinner from '../UI/LoadingSpinner';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import DeleteConfirmModal from '../UI/DeleteConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { canPerformAction } from '../../utils/rbac';

const Appointments = () => {
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Force re-render when refreshKey changes
  useEffect(() => {
    // Development-only logging
    if (process.env.NODE_ENV === 'development' && refreshKey > 0) {
      console.log('Refresh key changed, forcing re-render');
    }
  }, [refreshKey]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle the response structure from the backend
      const data = response.data;
      console.log('Fetched appointments data:', data);
      const appointmentsList = data.appointments || data || [];
      console.log('Setting appointments to:', appointmentsList);
      console.log('First appointment details:', appointmentsList[0]);
      // Create a new array reference to force React re-render
      setAppointments([...appointmentsList]);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      setAppointments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setShowModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleDeleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDeleteModal(true);
  };

  const handleSaveAppointment = async (formData) => {
    console.log('handleSaveAppointment called with data:', formData);
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (selectedAppointment) {
        // Update existing appointment
        console.log('Updating existing appointment:', selectedAppointment._id);
        const response = await axios.put(`/api/appointments/${selectedAppointment._id}`, formData, { headers });
        console.log('Update response:', response.data);
      } else {
        // Create new appointment
        console.log('Creating new appointment with data:', formData);
        const response = await axios.post('/api/appointments', formData, { headers });
        console.log('Create response:', response.data);
      }

      // Refresh the appointments list
      await fetchAppointments();
      
      // Force re-render by updating refresh key
      setRefreshKey(prev => prev + 1);
      
      // Trigger dashboard refresh
      triggerRefresh();
      
      // Show success message (you can add toast notifications here)
    } catch (error) {
      console.error('Error saving appointment:', error);
      throw error; // Re-throw to let the modal handle the error display
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${selectedAppointment._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh the appointments list
      await fetchAppointments();
      
      // Trigger dashboard refresh
      triggerRefresh();
      
      // Close modal and show success message
      setShowDeleteModal(false);
      setSelectedAppointment(null);
      console.log('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      // You can add error handling here (toast notification, etc.)
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedAppointment(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAppointment(null);
  };

  const filteredAppointments = useMemo(() => {
    return Array.isArray(appointments) ? appointments.filter(appointment => {
      const matchesSearch = appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && appointment.status === filterStatus;
    }) : [];
  }, [appointments, searchTerm, filterStatus, refreshKey]);

  console.log('Filtered appointments:', filteredAppointments.length, filteredAppointments);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'booked': return 'badge-info';
      case 'confirmed': return 'badge-warning';
      case 'in-progress': return 'badge-info';
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'no-show': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const formatDateTime = (dateTime) => {
    try {
      return format(new Date(dateTime), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container-responsive">
        <div className="alert alert-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="card-title">Appointments</h1>
              <p className="text-muted">
                {user?.role === 'patient' 
                  ? 'View and manage your appointments' 
                  : 'Manage patient appointments and schedules'
                }
              </p>
            </div>
            {canPerformAction(user?.role, 'create', 'appointments') && (
              <button 
                className="btn btn-primary"
                onClick={handleAddAppointment}
              >
                <FaPlus className="mr-2" />
                {user?.role === 'patient' ? 'Book My Appointment' : 'Book Appointment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Status</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <h2 className="card-title">Appointment List</h2>
            <span className="text-muted small">
              {filteredAppointments.length} of {appointments.length} appointments
            </span>
          </div>
        </div>
        <div className="card-body">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-5">
              <div className="mx-auto text-muted mb-3">
                <FaCalendarAlt size={48} />
              </div>
              <h3 className="h5 text-dark">No appointments found</h3>
              <p className="text-muted">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : user?.role === 'patient' 
                    ? 'You don\'t have any appointments yet. Book your first appointment to get started.'
                    : 'Get started by booking a new appointment.'
                }
              </p>
              {!searchTerm && canPerformAction(user?.role, 'create', 'appointments') && (
                <div className="mt-4">
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddAppointment}
                  >
                    <FaPlus className="me-2" />
                    {user?.role === 'patient' ? 'Book My First Appointment' : 'Book First Appointment'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table" key={refreshKey}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-secondary-50">
                      <td>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">
                              {appointment.patient?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-secondary-900">
                              {appointment.patient?.name}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {appointment.patient?.contact}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{appointment.doctor?.name}</div>
                        <div className="text-sm text-secondary-500">{appointment.doctor?.specialization}</div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{formatDateTime(appointment.dateTime)}</div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900 capitalize">{appointment.type}</div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{appointment.duration} min</div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-primary-600 hover:text-primary-700 p-1 rounded"
                            title="View Details"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          {canPerformAction(user?.role, 'update', 'appointments') && (
                            <button
                              className="text-secondary-600 hover:text-secondary-700 p-1 rounded"
                              title="Edit Appointment"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          )}
                          {canPerformAction(user?.role, 'delete', 'appointments') && (
                            <button
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                              title="Delete Appointment"
                              onClick={() => handleDeleteAppointment(appointment)}
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        appointment={selectedAppointment}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        item={selectedAppointment}
        itemType="appointment"
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
      />
    </div>
  );
};

export default Appointments;
