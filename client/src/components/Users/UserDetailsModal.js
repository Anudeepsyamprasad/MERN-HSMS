import React from 'react';
import { FaTimes, FaUser, FaEnvelope, FaUserCog, FaUserMd, FaUser as FaUserIcon, FaCalendar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUserCog className="h-5 w-5 text-red-600" />;
      case 'doctor': return <FaUserMd className="h-5 w-5 text-blue-600" />;
      case 'patient': return <FaUserIcon className="h-5 w-5 text-green-600" />;
      default: return <FaUserIcon className="h-5 w-5 text-secondary-600" />;
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, padding: '20px' }}>
      <div className="bg-white rounded shadow-lg" style={{ 
        width: '100%', 
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom bg-light">
          <h3 className="h4 mb-0 text-dark fw-bold">User Details</h3>
          <button onClick={onClose} className="btn btn-outline-secondary btn-sm p-2">
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4" style={{ overflowY: 'auto', flex: 1 }}>
          <div className="row g-4">
            {/* User Avatar and Basic Info */}
            <div className="col-12">
              <div className="d-flex align-items-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 d-flex align-items-center justify-content-center me-4">
                  {getRoleIcon(user.role)}
                </div>
                <div>
                  <h4 className="h5 mb-1 text-dark fw-bold">{user.username}</h4>
                  <span className={`badge ${getRoleBadgeClass(user.role)} me-2`}>
                    {user.role}
                  </span>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="col-12">
              <h5 className="h6 text-dark fw-semibold mb-3">User Information</h5>
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <FaUser className="h-4 w-4 text-secondary-600 me-3" />
                    <div>
                      <div className="text-sm text-secondary-500">Username</div>
                      <div className="fw-semibold">{user.username}</div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <FaEnvelope className="h-4 w-4 text-secondary-600 me-3" />
                    <div>
                      <div className="text-sm text-secondary-500">Email</div>
                      <div className="fw-semibold">{user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    {getRoleIcon(user.role)}
                    <div className="ms-3">
                      <div className="text-sm text-secondary-500">Role</div>
                      <div className="fw-semibold text-capitalize">{user.role}</div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    {user.isActive ? (
                      <FaCheckCircle className="h-4 w-4 text-success me-3" />
                    ) : (
                      <FaTimesCircle className="h-4 w-4 text-warning me-3" />
                    )}
                    <div>
                      <div className="text-sm text-secondary-500">Status</div>
                      <div className="fw-semibold">{user.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="col-12">
              <h5 className="h6 text-dark fw-semibold mb-3">Account Information</h5>
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <FaCalendar className="h-4 w-4 text-secondary-600 me-3" />
                    <div>
                      <div className="text-sm text-secondary-500">Created</div>
                      <div className="fw-semibold">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {user.updatedAt && user.updatedAt !== user.createdAt && (
                  <div className="col-12">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <FaCalendar className="h-4 w-4 text-secondary-600 me-3" />
                      <div>
                        <div className="text-sm text-secondary-500">Last Updated</div>
                        <div className="fw-semibold">{formatDate(user.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {user.lastLogin && (
                  <div className="col-12">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <FaCalendar className="h-4 w-4 text-secondary-600 me-3" />
                      <div>
                        <div className="text-sm text-secondary-500">Last Login</div>
                        <div className="fw-semibold">{formatDate(user.lastLogin)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <FaUser className="h-4 w-4 text-secondary-600 me-3" />
                    <div>
                      <div className="text-sm text-secondary-500">User ID</div>
                      <div className="fw-semibold font-monospace">{user._id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 p-4 border-top bg-light">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;

