import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaEnvelope, FaLock, FaUserCog, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const UserModal = ({ isOpen, onClose, user = null, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Edit mode - populate with existing data
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // Don't populate password for edit
          confirmPassword: '', // Don't populate confirm password for edit
          role: user.role || 'patient',
          isActive: user.isActive !== undefined ? user.isActive : true
        });
      } else {
        // Add mode - reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'patient',
          isActive: true
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
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
      const processedData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        isActive: formData.isActive
      };

      // Only include password if it's provided (for new users or password updates)
      if (formData.password.trim()) {
        processedData.password = formData.password;
      }
      
      await onSave(processedData);
      
      // Show success message
      if (user) {
        if (formData.password.trim()) {
          toast.success('User updated successfully! Password has been changed.');
        } else {
          toast.success('User updated successfully!');
        }
      } else {
        toast.success('User created successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.message) {
        setErrors({ general: `Error: ${error.response.data.message}` });
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setErrors({ general: `Validation Error: ${errorMessages}` });
      } else {
        setErrors({ general: 'An error occurred while saving the user. Please try again.' });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, padding: '10px' }}>
      <div className="bg-white rounded shadow-lg" style={{ 
        width: '100%', 
        maxWidth: window.innerWidth < 768 ? '95vw' : '600px', 
        height: window.innerWidth < 768 ? '95vh' : 'auto',
        maxHeight: window.innerWidth < 768 ? '95vh' : '90vh',
        minHeight: window.innerWidth < 768 ? '500px' : '400px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Fixed Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom bg-light" style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 className="h4 mb-0 text-dark fw-bold">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="btn btn-outline-secondary btn-sm p-2" style={{ minWidth: '40px' }}>
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4" style={{ 
          flex: 1, 
          overflowY: 'auto',
          minHeight: 0
        }}>
          {errors.general && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Username */}
              <div className="col-12">
                <label className="form-label">
                  <FaUser className="me-2" />
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Enter username"
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              {/* Email */}
              <div className="col-12">
                <label className="form-label">
                  <FaEnvelope className="me-2" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Enter email address"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="col-12">
                <label className="form-label">
                  <FaLock className="me-2" />
                  Password {!user && '*'}
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder={user ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-2"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ border: 'none', background: 'none' }}
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                {user && (
                  <div className="form-text">Leave blank to keep the current password</div>
                )}
              </div>

              {/* Confirm Password - Only show if password is provided */}
              {formData.password && (
                <div className="col-12">
                  <label className="form-label">
                    <FaLock className="me-2" />
                    Confirm Password *
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-2"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      style={{ border: 'none', background: 'none' }}
                    >
                      {showPasswordConfirm ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>
              )}

              {/* Role */}
              <div className="col-12">
                <label className="form-label">
                  <FaUserCog className="me-2" />
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <div className="invalid-feedback">{errors.role}</div>}
              </div>

              {/* Status */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="form-check-input"
                    id="isActive"
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active User
                  </label>
                </div>
                <div className="form-text">Uncheck to deactivate this user</div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="d-flex justify-content-end gap-3 border-top bg-light" style={{ 
          flexShrink: 0,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          padding: window.innerWidth < 768 ? '15px' : '20px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary px-4 py-2"
            disabled={loading}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary px-4 py-2"
            disabled={loading}
            style={{ minWidth: '120px' }}
          >
            {loading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Saving...
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <FaSave className="me-2" />
                {user ? 'Update User' : 'Add User'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
