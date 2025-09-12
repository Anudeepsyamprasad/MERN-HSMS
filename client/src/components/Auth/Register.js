import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaLock, FaHospital, FaEye, FaEyeSlash, FaEnvelope, FaUserTag } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div className="logo">
            <FaHospital className="h-5 w-5 text-white" />
          </div>
          <h2>Create Account</h2>
          <p>Join the Hospital Management System</p>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  id="username"
                  type="text"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    }
                  })}
                  className={errors.username ? 'error' : ''}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <div className="error-message">{errors.username.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <div className="input-wrapper">
                <FaUserTag className="input-icon" />
                <select
                  id="role"
                  {...register('role', {
                    required: 'Role is required'
                  })}
                  className={errors.role ? 'error' : ''}
                >
                  <option value="">Select your role</option>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {errors.role && (
                <div className="error-message">{errors.role.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="error-message">{errors.password.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword.message}</div>
              )}
            </div>

            <div className="form-options">
              <div className="form-option">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  className="form-checkbox"
                  {...register('agreeTerms', {
                    required: 'You must agree to the terms and conditions'
                  })}
                />
                <label htmlFor="agree-terms" className="form-checkbox-label">
                  I agree to the{' '}
                  <button type="button" className="form-link">
                    Terms and Conditions
                  </button>
                </label>
              </div>
            </div>
            {errors.agreeTerms && (
              <div className="error-message mb-4">{errors.agreeTerms.message}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="form-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-secondary-500">
          © 2024 Hospital Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Register;
