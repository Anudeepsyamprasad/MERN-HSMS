import React from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaTint, FaIdCard, FaHistory } from 'react-icons/fa';

const PatientDetailsModal = ({ isOpen, onClose, patient }) => {
  if (!isOpen || !patient) return null;

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-form-container patient-details-modal">
      <div className="modal-form-wrapper">
        {/* Header */}
        <div className="modal-form-header">
          <h3>Patient Details</h3>
          <button
            onClick={onClose}
            className="close-btn"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-form-body">
            {/* Patient Header */}
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-primary-600">
                  {patient.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 truncate">{patient.name}</h3>
                <p className="text-sm text-secondary-500">Patient ID: {patient._id?.slice(-8)}</p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-grid mb-4">
              <div className="form-field">
                <label className="form-field label">
                  <FaUser className="inline mr-1" />
                  Full Name
                </label>
                <p className="form-field input">{patient.name || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaEnvelope className="inline mr-1" />
                  Email Address
                </label>
                <p className="form-field input">{patient.email || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaPhone className="inline mr-1" />
                  Contact Number
                </label>
                <p className="form-field input">{patient.contact || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaPhone className="inline mr-1" />
                  Emergency Contact
                </label>
                <p className="form-field input">{patient.emergencyContact || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaCalendar className="inline mr-1" />
                  Date of Birth
                </label>
                <p className="form-field input">{formatDate(patient.dateOfBirth)}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaIdCard className="inline mr-1" />
                  Age
                </label>
                <p className="form-field input">
                  {patient.age ? `${patient.age} years` : calculateAge(patient.dateOfBirth) ? `${calculateAge(patient.dateOfBirth)} years` : 'N/A'}
                </p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  Gender
                </label>
                <p className="form-field input capitalize">{patient.gender || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaTint className="inline mr-1" />
                  Blood Group
                </label>
                <p className="form-field input">{patient.bloodGroup || 'N/A'}</p>
              </div>
            </div>

            {/* Address */}
            <div className="form-field full-width mb-4">
              <label className="form-field label">
                <FaMapMarkerAlt className="inline mr-1" />
                Address
              </label>
              <p className="form-field input">{patient.address || 'N/A'}</p>
            </div>

            {/* Medical History */}
            {patient.medicalHistory && (
              <div className="form-field full-width mb-4">
                <label className="form-field label">
                  <FaHistory className="inline mr-1" />
                  Medical History
                </label>
                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-sm text-secondary-900 whitespace-pre-wrap break-words">
                    {patient.medicalHistory}
                  </p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="form-field mb-4">
              <label className="form-field label">
                Status
              </label>
              <span className={`badge ${patient.isActive ? 'badge-success' : 'badge-warning'}`}>
                {patient.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Created/Updated Info */}
            <div className="form-grid border-t pt-3 text-sm text-secondary-500">
              <div className="form-field">
                <span className="font-medium">Created:</span> {formatDate(patient.createdAt)}
              </div>
              <div className="form-field">
                <span className="font-medium">Last Updated:</span> {formatDate(patient.updatedAt)}
              </div>
            </div>
        </div>

        {/* Action Buttons - Always visible at bottom */}
        <div className="modal-form-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
