import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LoadingSpinner from '../UI/LoadingSpinner';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaUser, FaUserMd, FaUserCog, FaUserSlash } from 'react-icons/fa';
import UserModal from './UserModal';
import UserDetailsModal from './UserDetailsModal';
import DeleteConfirmModal from '../UI/DeleteConfirmModal';
import { useDashboard } from '../../contexts/DashboardContext';
import requestThrottle from '../../utils/requestThrottle';
import { retryApiCall } from '../../utils/apiRetry';
import toast from 'react-hot-toast';
import './Users.css';

const Users = () => {
  const { triggerRefresh } = useDashboard();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [actionType, setActionType] = useState(''); // 'delete' or 'deactivate'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      // Throttle the request to prevent rate limiting
      await requestThrottle.throttle('fetchUsers', 500); // 500ms throttle
      
      const token = localStorage.getItem('token');
      
      // Use retry mechanism for API call
      const response = await retryApiCall(async () => {
        return await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }, {
        maxRetries: 2, // Fewer retries for user list
        baseDelay: 2000 // 2 second base delay
      });

      // Handle the response structure from the backend
      const data = response.data;
      setUsers(data.users || data || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching users:', err);
      
      // Handle specific error types
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        toast.error('Rate limit exceeded. Please wait before trying again.');
        setRetryCount(prev => prev + 1);
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        toast.error('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch users');
      }
      
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.isActive === (filterStatus === 'active');
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUserCog className="h-4 w-4 text-red-600" />;
      case 'doctor': return <FaUserMd className="h-4 w-4 text-blue-600" />;
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

  // CRUD Operations
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setActionType('delete');
    setShowDeleteModal(true);
  };

  const handleDeactivateUser = (user) => {
    setSelectedUser(user);
    setActionType('deactivate');
    setShowDeactivateModal(true);
  };

  const handleActivateUser = async (user) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/users/${user._id}/activate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh the users list
      await fetchUsers();
      
      // Show success message
      toast.success('User activated successfully!');
      
      // Trigger dashboard refresh
      triggerRefresh();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveUser = async (formData) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (selectedUser) {
        // Update existing user
        await axios.put(`/api/users/${selectedUser._id}`, formData, { headers });
      } else {
        // Create new user
        await axios.post('/api/users', formData, { headers });
      }

      // Refresh the users list
      await fetchUsers();
      
      // Show success message
      if (selectedUser) {
        toast.success('User updated successfully!');
      } else {
        toast.success('User created successfully!');
      }
      
      // Trigger dashboard refresh
      triggerRefresh();
    } catch (error) {
      console.error('Error saving user:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);
    try {
      if (!selectedUser || !selectedUser._id) {
        toast.error('No user selected for this action.');
        return;
      }

      const token = localStorage.getItem('token');
      
      console.log('Confirming action:', {
        actionType,
        userId: selectedUser._id,
        userEmail: selectedUser.email,
        userRole: selectedUser.role
      });
      
      if (actionType === 'delete') {
        // Hard delete user
        console.log('Attempting to delete user:', selectedUser._id);
        await axios.delete(`/api/users/${selectedUser._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('User permanently deleted successfully!');
      } else if (actionType === 'deactivate') {
        // Deactivate user
        console.log('Attempting to deactivate user:', selectedUser._id);
        await axios.put(`/api/users/${selectedUser._id}/deactivate`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('User deactivated successfully!');
      }

      // Refresh the users list
      await fetchUsers();
      
      // Close modals and reset state
      setShowDeleteModal(false);
      setShowDeactivateModal(false);
      setSelectedUser(null);
      setActionType('');
      
      // Trigger dashboard refresh
      triggerRefresh();
    } catch (error) {
      console.error(`Error ${actionType}ing user:`, error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.hasAssociatedData) {
        toast.error('Cannot delete user with associated data. Please use the "Deactivate" button instead to preserve data integrity.');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('own account')) {
        toast.error('Cannot modify your own account.');
      } else if (error.response?.status === 400) {
        // Show the specific error message from the server
        const errorMessage = error.response?.data?.message || 'Bad request. Please check the data and try again.';
        toast.error(errorMessage);
      } else if (error.response?.status === 404) {
        toast.error('User not found. It may have been deleted by another admin.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(`Failed to ${actionType} user. Please try again.`);
      }
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container-responsive">
        <div className="alert alert-danger">
          <div className="d-flex justify-content-between align-items-center">
            <span>Error: {error}</span>
            {error.includes('Too many requests') && (
              <button 
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                  fetchUsers();
                }}
                className="btn btn-sm btn-outline-danger"
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="card-title">Users</h1>
              <p className="text-muted">Manage system users and their roles</p>
            </div>
            <button className="btn btn-primary" onClick={handleAddUser}>
              <FaPlus className="me-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">User List</h2>
            <span className="text-sm text-secondary-500">
              {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>
        <div className="card-body">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-secondary-300">
                <FaUser className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">No users found</h3>
              <p className="mt-2 text-sm text-secondary-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new user.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button className="btn btn-primary" onClick={handleAddUser}>
                    <FaPlus className="mr-2" />
                    Add First User
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-secondary-50">
                      <td>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-secondary-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-secondary-500">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{user.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-primary-600 hover:text-primary-700 p-1 rounded"
                            title="View Details"
                            onClick={() => handleViewUser(user)}
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-secondary-600 hover:text-secondary-700 p-1 rounded"
                            title="Edit User"
                            onClick={() => handleEditUser(user)}
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          {user.isActive ? (
                            <button
                              className="text-orange-600 hover:text-orange-700 p-1 rounded"
                              title="Deactivate User (Recommended for users with appointments/records)"
                              onClick={() => handleDeactivateUser(user)}
                            >
                              <FaUserSlash className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              className="text-green-600 hover:text-green-700 p-1 rounded"
                              title="Activate User"
                              onClick={() => handleActivateUser(user)}
                            >
                              <FaUserCog className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="text-red-600 hover:text-red-700 p-1 rounded"
                            title="Delete User Permanently (Only for users without associated data)"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />

      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        user={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionType('');
        }}
        item={selectedUser}
        itemType="user"
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
        actionType={actionType}
      />

      <DeleteConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setActionType('');
        }}
        item={selectedUser}
        itemType="user"
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
        actionType={actionType}
      />
    </div>
  );
};

export default Users;
