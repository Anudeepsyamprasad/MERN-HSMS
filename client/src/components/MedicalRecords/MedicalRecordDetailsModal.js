import React from 'react';
import { FaTimes, FaUser, FaUserMd, FaStethoscope, FaPills, FaCalendar, FaFileAlt, FaHeartbeat, FaWeight, FaThermometerHalf, FaTint, FaExclamationTriangle, FaEdit, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { canPerformAction } from '../../utils/rbac';
import './MedicalRecordDetailsModal.css';

const MedicalRecordDetailsModal = ({ isOpen, onClose, medicalRecord, onEdit, onDelete }) => {
  const { user } = useAuth();
  
  if (!isOpen || !medicalRecord) return null;

  const formatDate = (date) => {
    try {
      if (!date) return 'No date';
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return format(dateObj, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (date) => {
    try {
      if (!date) return 'No date';
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-success';
      case 'moderate': return 'bg-warning';
      case 'severe': return 'bg-warning text-dark';
      case 'critical': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <FaExclamationTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
      <div className="bg-white rounded shadow-lg w-100 medical-record-modal">
        {/* Fixed Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
          <h2 className="h5 mb-0 text-dark fw-semibold">
            Medical Record Details
          </h2>
          <div className="d-flex align-items-center gap-2">
            {/* Only show edit button for admin role */}
            {user?.role === 'admin' && onEdit && (
              <button
                onClick={() => onEdit(medicalRecord)}
                className="btn btn-outline-primary btn-sm p-2"
                title="Edit Record"
              >
                <FaEdit className="h-4 w-4" />
              </button>
            )}
            {/* Only show delete button for admin role */}
            {user?.role === 'admin' && onDelete && (
              <button
                onClick={() => onDelete(medicalRecord)}
                className="btn btn-outline-danger btn-sm p-2"
                title="Delete Record"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-outline-secondary btn-sm p-2"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 medical-record-modal-content">
          {/* Header Information */}
          <div className="row g-3 mb-4">
            {/* Patient Information */}
            <div className="col-12 col-lg-6">
              <div className="bg-primary bg-opacity-10 rounded p-3 h-100">
                <h3 className="h6 text-primary mb-3 d-flex align-items-center">
                  <FaUser className="me-2" />
                  Patient Information
                </h3>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-primary me-2">Name:</span>
                      <span className="text-dark">{medicalRecord.patient?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-primary me-2">Email:</span>
                      <span className="text-dark">{medicalRecord.patient?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-primary me-2">Contact:</span>
                      <span className="text-dark">{medicalRecord.patient?.contact || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="col-12 col-lg-6">
              <div className="bg-success bg-opacity-10 rounded p-3 h-100">
                <h3 className="h6 text-success mb-3 d-flex align-items-center">
                  <FaUserMd className="me-2" />
                  Doctor Information
                </h3>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-success me-2">Name:</span>
                      <span className="text-dark">{medicalRecord.doctor?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-success me-2">Specialization:</span>
                      <span className="text-dark">{medicalRecord.doctor?.specialization || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <span className="fw-semibold text-success me-2">Contact:</span>
                      <span className="text-dark">{medicalRecord.doctor?.contact || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="bg-light rounded p-3 h-100">
                <h4 className="h6 text-dark mb-2 d-flex align-items-center">
                  <FaCalendar className="me-2" />
                  Visit Date
                </h4>
                <p className="text-muted mb-0">{formatDate(medicalRecord.visitDate || medicalRecord.date)}</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="bg-light rounded p-3 h-100">
                <h4 className="h6 text-dark mb-2">Severity</h4>
                <span className={`badge ${getSeverityColor(medicalRecord.severity)} d-flex align-items-center`}>
                  {getSeverityIcon(medicalRecord.severity)}
                  <span className="ms-1 text-capitalize">{medicalRecord.severity}</span>
                </span>
              </div>
            </div>
            {medicalRecord.followUpDate && (
              <div className="col-12 col-md-4">
                <div className="bg-light rounded p-3 h-100">
                  <h4 className="h6 text-dark mb-2">Follow-up Date</h4>
                  <p className="text-muted mb-0">{formatDate(medicalRecord.followUpDate)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div className="mb-4">
            <h3 className="h6 text-dark mb-3 d-flex align-items-center">
              <FaStethoscope className="me-2" />
              Diagnosis
            </h3>
            <div className="bg-white border rounded p-3">
              <p className="text-dark mb-0">{medicalRecord.diagnosis || 'No diagnosis provided'}</p>
            </div>
          </div>

          {/* Symptoms */}
          {medicalRecord.symptoms && medicalRecord.symptoms.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Symptoms</h3>
              <div className="d-flex flex-wrap gap-2">
                {medicalRecord.symptoms.map((symptom, index) => (
                  <span key={index} className="badge bg-primary">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Treatment */}
          <div className="mb-4">
            <h3 className="h6 text-dark mb-3 d-flex align-items-center">
              <FaFileAlt className="me-2" />
              Treatment
            </h3>
            <div className="bg-white border rounded p-3">
              <p className="text-dark mb-0">{medicalRecord.treatment || 'No treatment provided'}</p>
            </div>
          </div>

          {/* Medications */}
          {medicalRecord.medications && medicalRecord.medications.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3 d-flex align-items-center">
                <FaPills className="me-2" />
                Prescribed Medications
              </h3>
              <div className="d-flex flex-wrap gap-2">
                {medicalRecord.medications.map((medication, index) => (
                  <span key={index} className="badge bg-success">
                    {medication}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vital Signs */}
          {medicalRecord.vitalSigns && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3 d-flex align-items-center">
                <FaHeartbeat className="me-2" />
                Vital Signs
              </h3>
              <div className="row g-3">
                {medicalRecord.vitalSigns.bloodPressure && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Blood Pressure</h4>
                      <p className="text-muted mb-0">
                        {medicalRecord.vitalSigns.bloodPressure.systolic}/{medicalRecord.vitalSigns.bloodPressure.diastolic} mmHg
                      </p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.heartRate && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Heart Rate</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.heartRate} bpm</p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.temperature && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Temperature</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.temperature}°F</p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.respiratoryRate && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Respiratory Rate</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.respiratoryRate} breaths/min</p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.oxygenSaturation && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Oxygen Saturation</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.oxygenSaturation}%</p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.weight && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Weight</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.weight} kg</p>
                    </div>
                  </div>
                )}
                {medicalRecord.vitalSigns.height && (
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="bg-white border rounded p-3 h-100">
                      <h4 className="h6 text-dark mb-2">Height</h4>
                      <p className="text-muted mb-0">{medicalRecord.vitalSigns.height} cm</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergies */}
          {medicalRecord.allergies && medicalRecord.allergies.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Allergies</h3>
              <div className="d-flex flex-wrap gap-2">
                {medicalRecord.allergies.map((allergy, index) => (
                  <span key={index} className="badge bg-danger">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Medications */}
          {medicalRecord.currentMedications && medicalRecord.currentMedications.length > 0 && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Current Medications</h3>
              <div className="d-flex flex-wrap gap-2">
                {medicalRecord.currentMedications.map((medication, index) => (
                  <span key={index} className="badge bg-warning text-dark">
                    {medication}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Family History */}
          {medicalRecord.familyHistory && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Family History</h3>
              <div className="bg-white border rounded p-3">
                <p className="text-dark mb-0">{medicalRecord.familyHistory}</p>
              </div>
            </div>
          )}

          {/* Social History */}
          {medicalRecord.socialHistory && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Social History</h3>
              <div className="bg-white border rounded p-3">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="d-flex">
                      <span className="fw-semibold text-dark me-2">Smoking:</span>
                      <span className="text-muted">{medicalRecord.socialHistory.smoking ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="d-flex">
                      <span className="fw-semibold text-dark me-2">Alcohol:</span>
                      <span className="text-muted">{medicalRecord.socialHistory.alcohol ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  {medicalRecord.socialHistory.occupation && (
                    <div className="col-12 col-md-6">
                      <div className="d-flex">
                        <span className="fw-semibold text-dark me-2">Occupation:</span>
                        <span className="text-muted">{medicalRecord.socialHistory.occupation}</span>
                      </div>
                    </div>
                  )}
                  {medicalRecord.socialHistory.lifestyle && (
                    <div className="col-12 col-md-6">
                      <div className="d-flex">
                        <span className="fw-semibold text-dark me-2">Lifestyle:</span>
                        <span className="text-muted">{medicalRecord.socialHistory.lifestyle}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {medicalRecord.notes && (
            <div className="mb-4">
              <h3 className="h6 text-dark mb-3">Notes</h3>
              <div className="bg-white border rounded p-3">
                <p className="text-dark mb-0">{medicalRecord.notes}</p>
              </div>
            </div>
          )}

          {/* Record Metadata */}
          <div className="border-top pt-3">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="d-flex">
                  <span className="fw-semibold text-muted me-2">Created:</span>
                  <span className="text-muted">{formatDateTime(medicalRecord.createdAt)}</span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex">
                  <span className="fw-semibold text-muted me-2">Last Updated:</span>
                  <span className="text-muted">{formatDateTime(medicalRecord.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetailsModal;
