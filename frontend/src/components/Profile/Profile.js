import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaSave, FaEdit, FaUserShield, FaUserMd, FaUserInjured } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return FaUserShield;
      case 'doctor':
        return FaUserMd;
      case 'patient':
        return FaUserInjured;
      default:
        return FaUser;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-600';
      case 'doctor':
        return 'bg-green-100 text-green-600';
      case 'patient':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setIsEditing(false);
        setMessage('Profile updated successfully!');
      }
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (result.success) {
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setMessage('Password changed successfully!');
      }
    } catch (error) {
      setMessage('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="card profile-header">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="profile-title">Profile</h1>
              <p className="profile-subtitle">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="row">
        {/* Profile Card */}
        <div className="col-lg-4 col-md-12 mb-4">
          <div className="card profile-card">
            <div className="card-body text-center">
              <div className="profile-avatar mx-auto mb-4">
                <RoleIcon className="profile-avatar-icon" />
              </div>
              <h2 className="profile-name">{user?.username}</h2>
              <p className="profile-email mb-2">{user?.email}</p>
              <span className={`badge profile-role ${getRoleColor(user?.role)}`}>
                {user?.role}
              </span>
              <div className="profile-info mt-4">
                <p className="profile-info-text">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
                <p className="profile-info-text">Last login: {user?.lastLogin ? new Date(user?.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="col-lg-8 col-md-12">
          <div className="card profile-form-card">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="card-title">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <FaEdit className="me-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert mb-4 ${
                  message.includes('successfully') 
                    ? 'alert-success' 
                    : 'alert-danger'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleProfileUpdate}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <input
                          id="username"
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          disabled={!isEditing}
                          className={`form-control ${!isEditing ? 'bg-light' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={!isEditing}
                          className={`form-control ${!isEditing ? 'bg-light' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card mt-4 password-card">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="card-title">Change Password</h2>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <FaLock className="me-2" />
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {isChangingPassword && (
                <form onSubmit={handlePasswordChange}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="currentPassword" className="form-label">
                          Current Password
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">
                          New Password
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="form-control"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm New Password
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="form-control"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <FaLock className="me-2" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
