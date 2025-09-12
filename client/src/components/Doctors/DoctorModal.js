import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserMd, FaGraduationCap, FaIdCard } from 'react-icons/fa';

const DoctorModal = ({ isOpen, onClose, doctor = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    education: '',
    consultationFee: '',
    address: '',
    isAvailable: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (doctor) {
      // Handle education field - convert array to string for form display
      let educationString = '';
      if (doctor.education) {
        if (Array.isArray(doctor.education)) {
          educationString = doctor.education.map(edu => 
            `${edu.degree || ''} ${edu.institution || ''} ${edu.year || ''}`.trim()
          ).join(', ');
        } else if (typeof doctor.education === 'string') {
          educationString = doctor.education;
        }
      }

      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        contact: doctor.contact || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        experience: doctor.experience || '',
        education: educationString,
        consultationFee: doctor.consultationFee || '',
        address: doctor.address || '',
        isAvailable: doctor.isAvailable !== undefined ? doctor.isAvailable : true
      });
    } else {
      setFormData({
        name: '',
        email: '',
        contact: '',
        specialization: '',
        licenseNumber: '',
        experience: '',
        education: '',
        consultationFee: '',
        address: '',
        isAvailable: true
      });
    }
    setErrors({});
  }, [doctor, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || (typeof formData.name === 'string' && !formData.name.trim())) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email || (typeof formData.email === 'string' && !formData.email.trim())) {
      newErrors.email = 'Email is required';
    } else if (typeof formData.email === 'string' && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.contact || (typeof formData.contact === 'string' && !formData.contact.trim())) {
      newErrors.contact = 'Contact number is required';
    }

    if (!formData.specialization || (typeof formData.specialization === 'string' && !formData.specialization.trim())) {
      newErrors.specialization = 'Specialization is required';
    }

    if (!formData.licenseNumber || (typeof formData.licenseNumber === 'string' && !formData.licenseNumber.trim())) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.experience || formData.experience === '' || parseInt(formData.experience) < 0) {
      newErrors.experience = 'Experience must be a positive number';
    }

    if (!formData.education || (typeof formData.education === 'string' && !formData.education.trim())) {
      newErrors.education = 'Education is required';
    }

    if (!formData.consultationFee || formData.consultationFee === '' || parseFloat(formData.consultationFee) < 0) {
      newErrors.consultationFee = 'Consultation fee must be a positive number';
    }

    if (!formData.address || (typeof formData.address === 'string' && !formData.address.trim())) {
      newErrors.address = 'Address is required';
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
      // Convert string values to appropriate types and handle education field
      const processedData = {
        ...formData,
        experience: parseInt(formData.experience) || 0,
        consultationFee: parseFloat(formData.consultationFee) || 0,
        isAvailable: Boolean(formData.isAvailable),
        // Keep education as string for now (backend will handle conversion if needed)
        education: formData.education || ''
      };
      
      await onSave(processedData);
      onClose();
    } catch (error) {
      console.error('Error saving doctor:', error);
      // Show error message to user
      if (error.response?.data?.message) {
        setErrors({ general: `Error: ${error.response.data.message}` });
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setErrors({ general: `Validation Error: ${errorMessages}` });
      } else {
        setErrors({ general: 'An error occurred while saving the doctor. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
          <h3>{doctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-form-body">
          {errors.general && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
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

              {/* Specialization */}
              <div className="form-group">
                <label>
                  <FaUserMd className="inline mr-2" />
                  Specialization *
                </label>
                <div className="input-wrapper">
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={errors.specialization ? 'error' : ''}
                  >
                    <option value="">Select specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Urology">Urology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                    <option value="Anesthesiology">Anesthesiology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="ENT">ENT</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.specialization && <div className="error-message">{errors.specialization}</div>}
              </div>

              {/* License Number */}
              <div className="form-group">
                <label>
                  <FaIdCard className="inline mr-2" />
                  License Number *
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={errors.licenseNumber ? 'error' : ''}
                    placeholder="Enter license number"
                  />
                </div>
                {errors.licenseNumber && <div className="error-message">{errors.licenseNumber}</div>}
              </div>

              {/* Experience */}
              <div className="form-group">
                <label>Experience (Years) *</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={errors.experience ? 'error' : ''}
                    placeholder="Enter years of experience"
                    min="0"
                    max="50"
                  />
                </div>
                {errors.experience && <div className="error-message">{errors.experience}</div>}
              </div>

              {/* Education */}
              <div className="form-group">
                <label>
                  <FaGraduationCap className="inline mr-2" />
                  Education *
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className={errors.education ? 'error' : ''}
                    placeholder="e.g., MBBS, MD, PhD"
                  />
                </div>
                {errors.education && <div className="error-message">{errors.education}</div>}
              </div>

              {/* Consultation Fee */}
              <div className="form-group">
                <label>
                  <span className="inline mr-2" style={{fontSize: '16px'}}>&#8377;</span>
                  Consultation Fee *
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    className={errors.consultationFee ? 'error' : ''}
                    placeholder="Enter consultation fee (₹)"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.consultationFee && <div className="error-message">{errors.consultationFee}</div>}
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

              {/* Availability */}
              <div className="form-group">
                <label>Availability</label>
                <div className="input-wrapper">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Available for consultations
                  </label>
                </div>
              </div>
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
                {doctor ? 'Update Doctor' : 'Add Doctor'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorModal;
