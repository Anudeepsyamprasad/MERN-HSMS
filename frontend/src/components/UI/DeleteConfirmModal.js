import React from 'react';
import { FaTimes, FaExclamationTriangle, FaUser, FaTrash, FaFileMedical, FaCalendarAlt, FaUserMd } from 'react-icons/fa';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false, 
  item, 
  itemType = 'item', // 'user', 'patient', 'doctor', 'medicalRecord', 'appointment'
  actionType = 'delete' // 'delete' or 'deactivate' (for users)
}) => {
  if (!isOpen || !item) return null;

  const getItemIcon = (type) => {
    switch (type) {
      case 'user': return <FaUser className="h-4 w-4" />;
      case 'patient': return <FaUser className="h-4 w-4" />;
      case 'doctor': return <FaUserMd className="h-4 w-4" />;
      case 'medicalRecord': return <FaFileMedical className="h-4 w-4" />;
      case 'appointment': return <FaCalendarAlt className="h-4 w-4" />;
      default: return <FaTrash className="h-4 w-4" />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUser className="h-4 w-4 text-red-600" />;
      case 'doctor': return <FaUser className="h-4 w-4 text-blue-600" />;
      case 'patient': return <FaUser className="h-4 w-4 text-green-600" />;
      default: return <FaUser className="h-4 w-4 text-secondary-600" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-danger';
      case 'doctor': return 'badge-info';
      case 'patient': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getActionConfig = () => {
    if (itemType === 'user' && actionType === 'deactivate') {
      return {
        title: 'Confirm User Deactivation',
        warning: 'Deactivating a user will prevent them from logging into the system. This action can be reversed by an administrator.',
        buttonText: 'Deactivate User',
        buttonClass: 'btn-warning',
        iconClass: 'text-warning',
        alertClass: 'alert-warning'
      };
    } else if (itemType === 'user' && actionType === 'delete') {
      return {
        title: 'Confirm User Deletion',
        warning: 'This action will permanently delete the user and all associated data from the system. This should only be used for users without appointments or medical records. Consider deactivating instead to preserve data integrity.',
        buttonText: 'Delete User',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    } else if (itemType === 'patient') {
      return {
        title: 'Confirm Patient Deletion',
        warning: 'This action will permanently delete the patient record and all associated data. Patient records, medical records, and appointment history will be lost. This action cannot be reversed.',
        buttonText: 'Delete Patient',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    } else if (itemType === 'doctor') {
      return {
        title: 'Confirm Doctor Deletion',
        warning: 'This action will permanently delete the doctor record and all associated data. All appointments and medical records for this doctor will be affected. This action cannot be reversed.',
        buttonText: 'Delete Doctor',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    } else if (itemType === 'medicalRecord') {
      return {
        title: 'Confirm Medical Record Deletion',
        warning: 'This action will permanently delete the medical record. All associated data including vital signs, treatment history, and notes will be lost. This action cannot be reversed.',
        buttonText: 'Delete Record',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    } else if (itemType === 'appointment') {
      return {
        title: 'Confirm Appointment Deletion',
        warning: 'This action will permanently delete the appointment record. All associated notes and details will be removed. Consider cancelling instead of deleting if the appointment was scheduled.',
        buttonText: 'Delete Appointment',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    } else {
      return {
        title: 'Confirm Deletion',
        warning: 'This action will permanently delete the item. This action cannot be undone.',
        buttonText: 'Delete',
        buttonClass: 'btn-danger',
        iconClass: 'text-danger',
        alertClass: 'alert-danger'
      };
    }
  };

  const config = getActionConfig();

  const renderItemDetails = () => {
    if (itemType === 'user') {
      return (
        <div className="bg-light rounded p-3 mb-4">
          <div className="d-flex align-items-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 d-flex align-items-center justify-content-center me-3">
              {getRoleIcon(item.role)}
            </div>
            <div>
              <div className="fw-semibold text-dark">{item.username}</div>
              <div className="text-sm text-secondary-600">{item.email}</div>
              <span className={`badge ${getRoleBadgeClass(item.role)}`}>
                {item.role}
              </span>
            </div>
          </div>
        </div>
      );
    } else if (itemType === 'patient') {
      return (
        <div className="bg-light rounded p-3 mb-4">
          <div className="d-flex align-items-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 d-flex align-items-center justify-content-center me-3">
              {getItemIcon('patient')}
            </div>
            <div>
              <div className="fw-semibold text-dark">{item.name}</div>
              <div className="text-sm text-secondary-600">{item.email}</div>
              <div className="text-sm text-secondary-600">{item.contact}</div>
            </div>
          </div>
        </div>
      );
    } else if (itemType === 'doctor') {
      return (
        <div className="bg-light rounded p-3 mb-4">
          <div className="d-flex align-items-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 d-flex align-items-center justify-content-center me-3">
              {getItemIcon('doctor')}
            </div>
            <div>
              <div className="fw-semibold text-dark">{item.name}</div>
              <div className="text-sm text-secondary-600">{item.email}</div>
              <div className="text-sm text-secondary-600">{item.specialization}</div>
            </div>
          </div>
        </div>
      );
    } else if (itemType === 'medicalRecord') {
      return (
        <div className="bg-light rounded p-3 mb-4">
          <div className="d-flex align-items-center mb-2">
            <FaFileMedical className="h-4 w-4 text-muted me-2" />
            <span className="small fw-semibold text-dark">Record Details:</span>
          </div>
          <div className="small text-muted">
            <div className="mb-1"><strong>Patient:</strong> {item.patient?.name}</div>
            <div className="mb-1"><strong>Doctor:</strong> {item.doctor?.name}</div>
            <div className="mb-1"><strong>Diagnosis:</strong> {item.diagnosis}</div>
            <div className="mb-0"><strong>Date:</strong> {new Date(item.visitDate || item.date).toLocaleDateString()}</div>
          </div>
        </div>
      );
    } else if (itemType === 'appointment') {
      return (
        <div className="bg-light rounded p-3 mb-4">
          <div className="d-flex align-items-center mb-2">
            <FaCalendarAlt className="h-4 w-4 text-muted me-2" />
            <span className="small fw-semibold text-dark">Appointment Details:</span>
          </div>
          <div className="small text-muted">
            <div className="mb-1"><strong>Patient:</strong> {item.patient?.name || 'Unknown'}</div>
            <div className="mb-1"><strong>Doctor:</strong> Dr. {item.doctor?.name || 'Unknown'}</div>
            <div className="mb-1"><strong>Date:</strong> {item.dateTime ? new Date(item.dateTime).toLocaleDateString() : 'Unknown'}</div>
            <div className="mb-0"><strong>Reason:</strong> {item.reason || 'Not specified'}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
      <div className="bg-white rounded shadow-lg delete-confirm-modal">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <h4 className="h5 mb-0 text-dark fw-semibold">{config.title}</h4>
          <button onClick={onClose} className="btn btn-outline-secondary btn-sm p-2">
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="d-flex align-items-center mb-4">
            <div className={`h-12 w-12 rounded-full d-flex align-items-center justify-content-center me-3 ${config.buttonClass === 'btn-danger' ? 'bg-danger-100' : 'bg-warning-100'}`}>
              <FaExclamationTriangle className={`h-6 w-6 ${config.iconClass}`} />
            </div>
            <div>
              <h5 className="h6 mb-1 text-dark fw-semibold">Are you sure?</h5>
              <p className="text-secondary-600 mb-0">
                {actionType === 'delete' 
                  ? 'This action will permanently delete the item.' 
                  : 'This action will deactivate the user account.'
                }
              </p>
            </div>
          </div>

          {/* Item Details */}
          {renderItemDetails()}

          <div className={`alert ${config.alertClass}`}>
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> {config.warning}
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 p-4 border-top bg-light">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn ${config.buttonClass}`}
            disabled={loading}
          >
            {loading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                {actionType === 'delete' ? 'Deleting...' : 'Deactivating...'}
              </div>
            ) : (
              config.buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
