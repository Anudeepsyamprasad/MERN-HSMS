import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { FaTimes, FaCalendarAlt, FaClock, FaUser, FaPhone, FaStethoscope, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './DoctorScheduleModal.css';

const DoctorScheduleModal = ({ isOpen, onClose, doctor }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    if (isOpen && doctor) {
      fetchAppointments();
    }
  }, [isOpen, doctor, selectedDate, viewMode]);

  const fetchAppointments = async () => {
    if (!doctor) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      let startDate, endDate;
      
      // Calculate date range based on view mode
      const date = new Date(selectedDate);
      switch (viewMode) {
        case 'day':
          startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
          break;
        case 'week':
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
          endDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          break;
        default:
          startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      }

      const response = await api.get('/api/appointments', {
        params: {
          doctorId: doctor._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in-progress':
        return <FaSpinner className="text-blue-500 animate-spin" />;
      case 'completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      case 'no-show':
        return <FaExclamationTriangle className="text-orange-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupAppointmentsByDate = () => {
    const grouped = {};
    appointments.forEach(appointment => {
      const date = new Date(appointment.dateTime).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    // Sort appointments within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    });
    
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByDate();

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col mx-auto modal-container">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <FaCalendarAlt className="text-primary-600 text-lg sm:text-xl flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                Dr. {doctor.name}'s Schedule
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{doctor.specialization}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2 p-1"
          >
            <FaTimes className="text-lg sm:text-xl" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 filter-controls">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">View:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="form-input text-xs sm:text-sm min-w-0 flex-1 sm:flex-none"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input text-xs sm:text-sm min-w-0 flex-1 sm:flex-none"
                />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 min-h-0 modal-content-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-2xl text-primary-600 mr-3" />
              <span className="text-gray-600">Loading appointments...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">Error</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchAppointments}
                className="mt-4 btn btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">
                No appointments scheduled for the selected {viewMode}.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 md:space-y-6 appointment-grid">
              {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
                <div key={date} className="border border-gray-200 rounded-lg overflow-hidden schedule-appointment-item">
                  <div className="bg-gray-50 px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base md:text-lg">
                      {formatDate(dayAppointments[0].dateTime)}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {dayAppointments.map((appointment) => (
                      <div key={appointment._id} className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors appointment-item">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
                          {/* Time and Status Column */}
                          <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(appointment.status)}
                              <span className="font-medium text-gray-900 text-sm sm:text-base appointment-time">
                                {formatTime(appointment.dateTime)}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit status-badge ${getStatusColor(appointment.status)}`}>
                              {appointment.status.replace('-', ' ')}
                            </span>
                            <div className="text-xs sm:text-sm text-gray-500 lg:hidden">
                              <div className="font-medium">{appointment.duration} min</div>
                              <div className="capitalize text-gray-400">{appointment.type}</div>
                            </div>
                          </div>
                          
                          {/* Patient Info Column */}
                          <div className="lg:col-span-6 flex-1 min-w-0">
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="flex items-center space-x-2 patient-info">
                                <FaUser className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-900 font-medium text-xs sm:text-sm md:text-base truncate">
                                  {appointment.patient?.name || 'Unknown Patient'}
                                </span>
                              </div>
                              
                              {appointment.patient?.contact && (
                                <div className="flex items-center space-x-2">
                                  <FaPhone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-600 text-xs sm:text-sm md:text-base">{appointment.patient.contact}</span>
                                </div>
                              )}
                              
                              <div className="flex items-start space-x-2">
                                <FaStethoscope className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-xs sm:text-sm md:text-base break-words leading-relaxed appointment-reason">{appointment.reason}</span>
                              </div>
                              
                              {appointment.notes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-600 leading-relaxed appointment-notes">
                                  <strong>Notes:</strong> {appointment.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Duration and Type Column */}
                          <div className="lg:col-span-3 text-right text-xs sm:text-sm text-gray-500 flex-shrink-0 hidden lg:block">
                            <div className="font-medium">{appointment.duration} min</div>
                            <div className="capitalize text-gray-400">{appointment.type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-3 sm:p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorScheduleModal;
