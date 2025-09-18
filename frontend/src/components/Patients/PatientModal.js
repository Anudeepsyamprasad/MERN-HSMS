import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaTint, FaLock, FaUserTag } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin } from '../../utils/rbac';

const PatientModal = ({ isOpen, onClose, patient = null, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    medicalHistory: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        email: patient.email || '',
        contact: patient.contact || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient.gender || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || '',
        emergencyContact: patient.emergencyContact || '',
        medicalHistory: patient.medicalHistory || '',
        username: patient.user?.username || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        contact: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        bloodGroup: '',
        emergencyContact: '',
        medicalHistory: '',
        username: '',
        password: ''
      });
    }
    setErrors({});
  }, [patient, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    // Admin-only validations for username and password
    if (isAdmin(user?.role)) {
      if (formData.username && formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Only include password if it's not empty
      const dataToSave = { ...formData };
      
      // Debug: Log the original form data
      console.log('Original form data:', formData);
      console.log('Password field value:', formData.password);
      console.log('Password field type:', typeof formData.password);
      console.log('Password field length:', formData.password ? formData.password.length : 'undefined');
      
      if (!dataToSave.password || dataToSave.password.trim() === '') {
        console.log('Password field is empty, removing from data');
        delete dataToSave.password;
      } else {
        console.log('Password field has value, keeping in data');
      }
      
      if (!dataToSave.username || dataToSave.username.trim() === '') {
        delete dataToSave.username;
      }
      
      console.log('Sending patient data:', dataToSave);
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving patient:', error);
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
    <div className="modal-form-container">
      <div className="modal-form-wrapper">
        <div className="modal-form-header">
          <h3>{patient ? 'Edit Patient' : 'Add New Patient'}</h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-form-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label>
                  <FaUser className="inline mr-2" />
                  Full Name *
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label>
                  <FaEnvelope className="inline mr-2" />
                  Email *
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              {/* Contact */}
              <div className="form-group">
                <label>
                  <FaPhone className="inline mr-2" />
                  Contact Number *
                </label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={errors.contact ? 'error' : ''}
                    placeholder="Enter contact number"
                  />
                </div>
                {errors.contact && <div className="error-message">{errors.contact}</div>}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label>
                  <FaCalendar className="inline mr-2" />
                  Date of Birth *
                </label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={errors.dateOfBirth ? 'error' : ''}
                  />
                </div>
                {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth}</div>}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label>Gender *</label>
                <div className="input-wrapper">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? 'error' : ''}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender && <div className="error-message">{errors.gender}</div>}
              </div>

              {/* Blood Group */}
              <div className="form-group">
                <label>
                  <FaTint className="inline mr-2" />
                  Blood Group *
                </label>
                <div className="input-wrapper">
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className={errors.bloodGroup ? 'error' : ''}
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                {errors.bloodGroup && <div className="error-message">{errors.bloodGroup}</div>}
              </div>

              {/* Address - Full Width */}
              <div className="form-group full-width">
                <label>
                  <FaMapMarkerAlt className="inline mr-2" />
                  Address *
                </label>
                <div className="input-wrapper">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'error' : ''}
                    placeholder="Enter full address"
                    rows="3"
                  />
                </div>
                {errors.address && <div className="error-message">{errors.address}</div>}
              </div>

              {/* Emergency Contact */}
              <div className="form-group">
                <label>Emergency Contact</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Enter emergency contact"
                  />
                </div>
              </div>

              {/* Medical History - Full Width */}
              <div className="form-group full-width">
                <label>Medical History</label>
                <div className="input-wrapper">
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Enter medical history"
                    rows="4"
                  />
                </div>
              </div>

              {/* Admin-only fields */}
              {isAdmin(user?.role) && (
                <>
                  <div className="form-group full-width">
                    <div className="admin-section-header">
                      <h4>Admin Settings</h4>
                      <p className="text-muted">These fields are only visible to administrators</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="form-group">
                    <label>
                      <FaUserTag className="inline mr-2" />
                      Username
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={errors.username ? 'error' : ''}
                        placeholder="Enter username"
                      />
                    </div>
                    {errors.username && <div className="error-message">{errors.username}</div>}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label>
                      <FaLock className="inline mr-2" />
                      Password
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                        placeholder="Enter new password (leave blank to keep current)"
                      />
                    </div>
                    {errors.password && <div className="error-message">{errors.password}</div>}
                    <small className="form-text text-muted">
                      Leave blank to keep the current password. Minimum 6 characters.
                    </small>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="modal-form-footer">
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
            onClick={handleSubmit}
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
                {patient ? 'Update Patient' : 'Add Patient'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientModal;
