import React from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserMd, FaGraduationCap, FaIdCard, FaCalendarAlt } from 'react-icons/fa';

const DoctorDetailsModal = ({ isOpen, onClose, doctor }) => {
  if (!isOpen || !doctor) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-form-container doctor-details-modal">
      <div className="modal-form-wrapper">
        {/* Header */}
        <div className="modal-form-header">
          <h3>Doctor Details</h3>
          <button
            onClick={onClose}
            className="close-btn"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-form-body">
            {/* Doctor Header */}
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <FaUserMd className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 truncate">{doctor.name}</h3>
                <p className="text-sm text-secondary-500">Doctor ID: {doctor._id?.slice(-8)}</p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-grid mb-4">
              <div className="form-field">
                <label className="form-field label">
                  <FaUser className="inline mr-1" />
                  Full Name
                </label>
                <p className="form-field input">{doctor.name || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaEnvelope className="inline mr-1" />
                  Email Address
                </label>
                <p className="form-field input">{doctor.email || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaPhone className="inline mr-1" />
                  Contact Number
                </label>
                <p className="form-field input">{doctor.contact || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaUserMd className="inline mr-1" />
                  Specialization
                </label>
                <p className="form-field input">{doctor.specialization || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaIdCard className="inline mr-1" />
                  License Number
                </label>
                <p className="form-field input">{doctor.licenseNumber || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaCalendarAlt className="inline mr-1" />
                  Experience
                </label>
                <p className="form-field input">
                  {doctor.experience ? `${doctor.experience} years` : 'N/A'}
                </p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <FaGraduationCap className="inline mr-1" />
                  Education
                </label>
                <p className="form-field input">{doctor.education || 'N/A'}</p>
              </div>

              <div className="form-field">
                <label className="form-field label">
                  <span className="inline mr-1" style={{fontSize: '16px'}}>&#8377;</span>
                  Consultation Fee
                </label>
                <p className="form-field input">
                  {doctor.consultationFee ? `₹${doctor.consultationFee}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="form-field full-width mb-4">
              <label className="form-field label">
                <FaMapMarkerAlt className="inline mr-1" />
                Address
              </label>
              <p className="form-field input">{doctor.address || 'N/A'}</p>
            </div>

            {/* Schedule */}
            {doctor.schedule && doctor.schedule.length > 0 && (
              <div className="form-field full-width mb-4">
                <label className="form-field label">
                  <FaCalendarAlt className="inline mr-1" />
                  Schedule
                </label>
                <div className="bg-secondary-50 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {doctor.schedule.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium capitalize">{schedule.day}</span>
                        <span className="text-sm text-secondary-600">
                          {schedule.from} - {schedule.to}
                        </span>
                        <span className={`badge ${schedule.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                          {schedule.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            {doctor.rating !== undefined && (
              <div className="form-field mb-4">
                <label className="form-field label">
                  Rating
                </label>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-secondary-600">
                    {doctor.rating.toFixed(1)} ({doctor.totalRatings || 0} reviews)
                  </span>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="form-field mb-4">
              <label className="form-field label">
                Status
              </label>
              <span className={`badge ${doctor.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* Created/Updated Info */}
            <div className="form-grid border-t pt-3 text-sm text-secondary-500">
              <div className="form-field">
                <span className="font-medium">Created:</span> {formatDate(doctor.createdAt)}
              </div>
              <div className="form-field">
                <span className="font-medium">Last Updated:</span> {formatDate(doctor.updatedAt)}
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

export default DoctorDetailsModal;
