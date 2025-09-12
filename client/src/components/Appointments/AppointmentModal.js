import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaUserMd, FaCalendar, FaClock, FaStethoscope, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './AppointmentModal.css';

const AppointmentModal = ({ isOpen, onClose, appointment = null, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    dateTime: '',
    duration: 30,
    status: 'booked',
    type: 'consultation',
    reason: '',
    notes: '',
    amount: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patient: appointment.patient?._id || appointment.patient || '',
        doctor: appointment.doctor?._id || appointment.doctor || '',
        dateTime: appointment.dateTime ? new Date(appointment.dateTime).toISOString().slice(0, 16) : '',
        duration: appointment.duration || 30,
        status: appointment.status || 'booked',
        type: appointment.type || 'consultation',
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        amount: appointment.amount || ''
      });
    } else {
      setFormData({
        patient: '',
        doctor: '',
        dateTime: '',
        duration: 30,
        status: 'booked',
        type: 'consultation',
        reason: '',
        notes: '',
        amount: ''
      });
    }
    setErrors({});
  }, [appointment, isOpen]);

  const fetchPatients = async () => {
    try {
      // For patients, we don't need to fetch patients list since they can only create appointments for themselves
      if (user?.role === 'patient') {
        console.log('Skipping patient fetch for patient role');
        setPatients([]); // No patients list needed for patients
        return;
      }

      console.log('Fetching patients for role:', user?.role);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const patients = response.data.patients || response.data || [];
      console.log('Fetched patients:', patients.length);
      setPatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]); // Set empty array on error
    }
  };

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors for role:', user?.role);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const doctors = response.data.doctors || response.data || [];
      console.log('Fetched doctors:', doctors.length);
      setDoctors(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]); // Set empty array on error
    }
  };

  const validateForm = () => {
    const newErrors = {};
    console.log('Validating form with data:', formData);
    console.log('User role:', user?.role);

    // Only require patient selection for admin and doctor users
    if (user?.role !== 'patient' && !formData.patient) {
      newErrors.patient = 'Patient is required';
      console.log('Validation error: Patient is required for', user?.role);
    }

    if (!formData.doctor) {
      newErrors.doctor = 'Doctor is required';
      console.log('Validation error: Doctor is required');
    }

    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time is required';
      console.log('Validation error: Date and time is required');
    } else {
      const selectedDate = new Date(formData.dateTime);
      const now = new Date();
      // Only validate future date for new appointments, not for editing existing ones
      if (!appointment && selectedDate <= now) {
        newErrors.dateTime = 'Appointment date must be in the future';
        console.log('Validation error: Date must be in the future');
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Appointment reason is required';
      console.log('Validation error: Reason is required');
    }

    if (formData.duration < 15 || formData.duration > 120) {
      newErrors.duration = 'Duration must be between 15 and 120 minutes';
      console.log('Validation error: Duration out of range');
    }

    if (formData.amount && (isNaN(formData.amount) || parseFloat(formData.amount) < 0)) {
      newErrors.amount = 'Amount must be a valid positive number';
      console.log('Validation error: Invalid amount');
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started for user role:', user?.role);
    
    // Clear previous errors
    setErrors({});
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, proceeding with submission');

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = {
        doctor: formData.doctor,
        dateTime: formData.dateTime,
        duration: parseInt(formData.duration),
        status: formData.status,
        type: formData.type,
        reason: formData.reason,
        notes: formData.notes,
        amount: formData.amount ? parseFloat(formData.amount) : undefined
      };

      // Only include patient for admin and doctor users
      if (user?.role !== 'patient') {
        submitData.patient = formData.patient;
      }

      console.log('Submitting appointment data:', submitData);
      await onSave(submitData);
      onClose();
    } catch (error) {
      let errorMessage = 'An error occurred while saving the appointment. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          const errorMessages = error.response.data.errors.map(err => err.msg || err.message || err).join(', ');
          errorMessage = `Validation Error: ${errorMessages}`;
        } else {
          errorMessage = `Validation Error: ${JSON.stringify(error.response.data.errors)}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center overflow-auto" style={{zIndex: 1050}}>
      <div className="bg-white rounded-lg shadow-lg w-100 mx-2 my-3 overflow-hidden d-flex flex-column appointment-modal-content" style={{maxWidth: '1000px', maxHeight: '90vh', minHeight: '400px'}}>
        <div className="d-flex align-items-center justify-content-between p-3 p-md-4 p-lg-6 border-bottom flex-shrink-0 appointment-modal-header">
          <h3 className="h5 h-md-4 font-semibold text-secondary-900 mb-0">
            {appointment ? 'Edit Appointment' : 'Book New Appointment'}
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-link text-secondary-400 hover:text-secondary-600 p-2 rounded-circle hover:bg-secondary-100"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-3 p-md-4 p-lg-6 appointment-modal-body">
          {errors.general && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {errors.general}
            </div>
          )}
          {Object.keys(errors).length > 0 && errors.general && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <strong>Debug Info:</strong> Check console for detailed error information.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row g-3 g-md-4 appointment-form-grid">
              {/* Patient Selection - Only show for admin and doctor users */}
              {user?.role !== 'patient' && (
                <div className="col-12 col-md-6 appointment-form-field">
                  <label className="form-label d-flex align-items-center">
                    <FaUser className="me-2" />
                    Patient *
                  </label>
                  <select
                    name="patient"
                    value={formData.patient}
                    onChange={handleChange}
                    className={`form-select ${errors.patient ? 'is-invalid' : ''}`}
                  >
                    <option value="">Select a patient</option>
                    {Array.isArray(patients) && patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} - {patient.contact}
                      </option>
                    ))}
                  </select>
                  {errors.patient && <div className="invalid-feedback">{errors.patient}</div>}
                </div>
              )}

              {/* Doctor Selection */}
              <div className="col-12 col-md-6">
                <label className="form-label d-flex align-items-center">
                  <FaUserMd className="me-2" />
                  Doctor *
                </label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  className={`form-select ${errors.doctor ? 'is-invalid' : ''}`}
                >
                  <option value="">Select a doctor</option>
                  {Array.isArray(doctors) && doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
                {errors.doctor && <div className="invalid-feedback">{errors.doctor}</div>}
              </div>

              {/* Date and Time */}
              <div className="col-12 col-md-6">
                <label className="form-label d-flex align-items-center">
                  <FaCalendar className="me-2" />
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  className={`form-control ${errors.dateTime ? 'is-invalid' : ''}`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.dateTime && <div className="invalid-feedback">{errors.dateTime}</div>}
              </div>

              {/* Duration */}
              <div className="col-12 col-md-6">
                <label className="form-label d-flex align-items-center">
                  <FaClock className="me-2" />
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
                  min="15"
                  max="120"
                  step="15"
                />
                {errors.duration && <div className="invalid-feedback">{errors.duration}</div>}
              </div>

              {/* Status */}
              <div className="col-12 col-md-6">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              {/* Type */}
              <div className="col-12 col-md-6">
                <label className="form-label d-flex align-items-center">
                  <FaStethoscope className="me-2" />
                  Appointment Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="routine-checkup">Routine Checkup</option>
                </select>
              </div>

              {/* Amount */}
              <div className="col-12 col-md-6">
                <label className="form-label d-flex align-items-center">
                  <span className="me-2" style={{fontSize: '16px'}}>&#8377;</span>
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                  placeholder="Enter consultation fee (₹)"
                  min="0"
                  step="0.01"
                />
                {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
              </div>

              {/* Reason - Full Width */}
              <div className="col-12">
                <label className="form-label d-flex align-items-center">
                  <FaFileAlt className="me-2" />
                  Reason for Appointment *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className={`form-control appointment-textarea ${errors.reason ? 'is-invalid' : ''}`}
                  placeholder="Enter the reason for the appointment"
                  rows="3"
                />
                {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
              </div>

              {/* Notes - Full Width */}
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control appointment-textarea"
                  placeholder="Additional notes or comments"
                  rows="3"
                />
              </div>
            </div>

            {/* Form Footer with Submit Button */}
            <div className="d-flex align-items-center justify-content-end gap-3 mt-4 pt-3 border-top">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FaSave className="mr-2" />
                    {appointment ? 'Update Appointment' : 'Book Appointment'}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
