import React from 'react';
import { FaTimes, FaUser, FaUserMd, FaCalendar, FaClock, FaStethoscope, FaFileAlt, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { format } from 'date-fns';
import './AppointmentDetailsModal.css';

const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
  if (!isOpen || !appointment) return null;

  const formatDateTime = (dateTime) => {
    try {
      return format(new Date(dateTime), 'EEEE, MMMM dd, yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

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

  const getTypeDisplayName = (type) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'follow-up': return 'Follow-up';
      case 'emergency': return 'Emergency';
      case 'routine-checkup': return 'Routine Checkup';
      default: return type;
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center overflow-auto" style={{zIndex: 1050}}>
      <div className="bg-white rounded-lg shadow-lg w-100 mx-2 my-3 overflow-hidden d-flex flex-column appointment-details-modal-content" style={{maxWidth: '1200px', maxHeight: '85vh', minHeight: '500px'}}>
        <div className="d-flex align-items-center justify-content-between p-3 p-md-4 p-lg-6 border-bottom flex-shrink-0 appointment-details-modal-header">
          <h2 className="h5 h-md-4 font-semibold text-secondary-900 mb-0">
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="btn btn-link text-secondary-400 hover:text-secondary-600 p-2 rounded-circle hover:bg-secondary-100"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-3 p-md-4 p-lg-6 appointment-details-modal-body">
          <div className="row g-3 g-md-4 g-lg-6 appointment-details-grid">
            {/* Appointment Information */}
            <div className="col-12 col-lg-6">
              <div className="bg-primary-50 rounded-lg p-3 p-md-4 h-100">
                <h3 className="h5 font-semibold text-primary-900 mb-3 mb-md-4 d-flex align-items-center">
                  <FaCalendar className="me-2" />
                  Appointment Information
                </h3>
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3">
                        <FaCalendar className="text-primary-600" style={{width: '16px', height: '16px'}} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="small text-secondary-600 mb-2">Date & Time</p>
                        <p className="fw-medium text-secondary-900 mb-0">{formatDateTime(appointment.dateTime)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3">
                        <FaClock className="text-primary-600" style={{width: '16px', height: '16px'}} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="small text-secondary-600 mb-2">Duration</p>
                        <p className="fw-medium text-secondary-900 mb-0">{appointment.duration} minutes</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3">
                        <FaStethoscope className="text-primary-600" style={{width: '16px', height: '16px'}} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="small text-secondary-600 mb-2">Type</p>
                        <p className="fw-medium text-secondary-900 mb-0">{getTypeDisplayName(appointment.type)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3">
                        <span className="text-primary-600 d-flex align-items-center justify-content-center" style={{width: '16px', height: '16px'}}>📋</span>
                      </div>
                      <div className="flex-grow-1">
                        <p className="small text-secondary-600 mb-2">Status</p>
                        <div className="d-flex align-items-center">
                          <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {appointment.amount && (
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 me-3">
                          <span className="text-primary-600" style={{fontSize: '16px'}}>&#8377;</span>
                        </div>
                        <div className="flex-grow-1">
                          <p className="small text-secondary-600 mb-2">Amount</p>
                          <p className="fw-medium text-secondary-900 mb-0">₹{appointment.amount}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reason and Notes */}
            <div className="col-12 mt-3 mt-md-4">
              <div className="bg-secondary-50 rounded-lg p-3 p-md-4 mb-3 mb-md-4">
                <h3 className="h5 font-semibold text-secondary-900 mb-3 mb-md-4 d-flex align-items-center">
                  <FaFileAlt className="me-2" />
                  Details
                </h3>
                <div className="row g-3">
                  <div className="col-12">
                    <p className="small text-secondary-600 mb-2">Reason for Appointment</p>
                    <p className="text-secondary-900 mb-0">{appointment.reason}</p>
                  </div>
                  {appointment.notes && (
                    <div className="col-12">
                      <p className="small text-secondary-600 mb-2">Notes</p>
                      <p className="text-secondary-900 mb-0">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patient and Doctor Information */}
            <div className="col-12">
              <div className="row g-3 g-md-4">
                {/* Patient Information */}
                <div className="col-12 col-lg-6">
                  <div className="bg-green-50 rounded-lg p-3 p-md-4 h-100">
                    <h3 className="h5 font-semibold text-green-900 mb-3 mb-md-4 d-flex align-items-center">
                      <FaUser className="me-2" />
                      Patient Information
                    </h3>
                    {appointment.patient ? (
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <div className="rounded-circle bg-green-100 d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
                                <span className="h6 fw-semibold text-green-600 mb-0">
                                  {appointment.patient.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <p className="fw-medium text-secondary-900 mb-1">{appointment.patient.name}</p>
                              <p className="small text-secondary-600 mb-0">Patient</p>
                            </div>
                          </div>
                        </div>
                        {appointment.patient.contact && (
                          <div className="col-12">
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0 me-3">
                                <FaPhone className="text-green-600" style={{width: '16px', height: '16px'}} />
                              </div>
                              <div className="flex-grow-1">
                                <p className="small text-secondary-600 mb-1">Contact</p>
                                <p className="fw-medium text-secondary-900 mb-0">{appointment.patient.contact}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.patient.email && (
                          <div className="col-12">
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0 me-3">
                                <FaEnvelope className="text-green-600" style={{width: '16px', height: '16px'}} />
                              </div>
                              <div className="flex-grow-1">
                                <p className="small text-secondary-600 mb-1">Email</p>
                                <p className="fw-medium text-secondary-900 mb-0">{appointment.patient.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.patient.address && (
                          <div className="col-12">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0 me-3 mt-1">
                                <FaMapMarkerAlt className="text-green-600" style={{width: '16px', height: '16px'}} />
                              </div>
                              <div className="flex-grow-1">
                                <p className="small text-secondary-600 mb-1">Address</p>
                                <p className="fw-medium text-secondary-900 mb-0">{appointment.patient.address}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-secondary-600 mb-0">Patient information not available</p>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="col-12 col-lg-6">
                  <div className="bg-blue-50 rounded-lg p-3 p-md-4 h-100">
                    <h3 className="h5 font-semibold text-blue-900 mb-3 mb-md-4 d-flex align-items-center">
                      <FaUserMd className="me-2" />
                      Doctor Information
                    </h3>
                    {appointment.doctor ? (
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <div className="rounded-circle bg-blue-100 d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
                                <span className="h6 fw-semibold text-blue-600 mb-0">
                                  {appointment.doctor.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <p className="fw-medium text-secondary-900 mb-1">Dr. {appointment.doctor.name}</p>
                              <p className="small text-secondary-600 mb-0">Doctor</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <FaStethoscope className="text-blue-600" style={{width: '16px', height: '16px'}} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="small text-secondary-600 mb-1">Specialization</p>
                              <p className="fw-medium text-secondary-900 mb-0">
                                {appointment.doctor.specialization || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <FaPhone className="text-blue-600" style={{width: '16px', height: '16px'}} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="small text-secondary-600 mb-1">Contact</p>
                              <p className="fw-medium text-secondary-900 mb-0">
                                {appointment.doctor.contact || 'Not available'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <FaEnvelope className="text-blue-600" style={{width: '16px', height: '16px'}} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="small text-secondary-600 mb-1">Email</p>
                              <p className="fw-medium text-secondary-900 mb-0">
                                {appointment.doctor.email || 'Not available'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-secondary-600 mb-0">Doctor information not available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* Additional Information */}
          {(appointment.cancelledBy || appointment.cancellationReason || appointment.paymentStatus) && (
            <div className="col-12 mt-3 mt-md-4">
              <div className="bg-yellow-50 rounded-lg p-3 p-md-4">
                <h3 className="h5 font-semibold text-yellow-900 mb-3 mb-md-4 d-flex align-items-center">
                  <span className="me-2">ℹ️</span>
                  Additional Information
                </h3>
                <div className="row g-3 g-md-4">
                  {/* Cancellation Information */}
                  {(appointment.cancelledBy || appointment.cancellationReason) && (
                    <div className="col-12">
                      <div className="row g-3 g-md-4">
                        {appointment.cancelledBy && (
                          <div className="col-12 col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0 me-3 mt-1">
                                <span className="text-warning-600 d-flex align-items-center justify-content-center" style={{width: '16px', height: '16px'}}>⚠️</span>
                              </div>
                              <div className="flex-grow-1">
                                <p className="small text-secondary-600 mb-1 fw-medium">Cancelled By</p>
                                <p className="fw-medium text-secondary-900 mb-0 text-capitalize">{appointment.cancelledBy}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.cancellationReason && (
                          <div className="col-12 col-md-6">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0 me-3 mt-1">
                                <span className="text-warning-600 d-flex align-items-center justify-content-center" style={{width: '16px', height: '16px'}}>📝</span>
                              </div>
                              <div className="flex-grow-1">
                                <p className="small text-secondary-600 mb-1 fw-medium">Cancellation Reason</p>
                                <p className="fw-medium text-secondary-900 mb-0">{appointment.cancellationReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Information */}
                  {appointment.paymentStatus && (
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <div className="flex-shrink-0 me-3 mt-1">
                          <span className="text-success-600 d-flex align-items-center justify-content-center" style={{width: '16px', height: '16px'}}>💳</span>
                        </div>
                        <div className="flex-grow-1">
                          <p className="small text-secondary-600 mb-2 fw-medium">Payment Status</p>
                          <span className={`badge ${
                            appointment.paymentStatus === 'paid' ? 'badge-success' :
                            appointment.paymentStatus === 'pending' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {appointment.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="col-12 mt-3 mt-md-4 pt-3 pt-md-4 border-top border-secondary-200">
            <div className="row g-3">
              {appointment.createdAt && (
                <div className="col-12 col-md-6">
                  <p className="small text-secondary-600 mb-0">Created: {format(new Date(appointment.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
              )}
              {appointment.updatedAt && appointment.updatedAt !== appointment.createdAt && (
                <div className="col-12 col-md-6">
                  <p className="small text-secondary-600 mb-0">Last Updated: {format(new Date(appointment.updatedAt), 'MMM dd, yyyy h:mm a')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <div className="d-flex align-items-center justify-content-end p-3 p-md-4 p-lg-6 border-top bg-secondary-50 flex-shrink-0 appointment-details-modal-footer">
          <button
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

export default AppointmentDetailsModal;
