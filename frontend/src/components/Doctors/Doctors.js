import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import LoadingSpinner from '../UI/LoadingSpinner';
import DoctorModal from './DoctorModal';
import DoctorDetailsModal from './DoctorDetailsModal';
import DoctorScheduleModal from './DoctorScheduleModal';
import DeleteConfirmModal from '../UI/DeleteConfirmModal';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaCalendarAlt, FaUserMd, FaEnvelope, FaPhone, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { canPerformAction } from '../../utils/rbac';
import './Doctors.css';

const Doctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors...');
      
      const response = await api.get('/api/doctors');

      console.log('Fetch doctors response:', response.data);
      
      // Handle the response structure from the backend
      const data = response.data;
      setDoctors(data.doctors || data || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching doctors:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch doctors');
      setDoctors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleSaveDoctor = async (formData) => {
    setModalLoading(true);
    try {
      let response;
      if (selectedDoctor) {
        // Update existing doctor
        console.log('Updating doctor:', selectedDoctor._id, formData);
        response = await api.put(`/api/doctors/${selectedDoctor._id}`, formData);
      } else {
        // Create new doctor
        console.log('Creating new doctor:', formData);
        response = await api.post('/api/doctors', formData);
      }

      console.log('Save response:', response.data);
      
      // Refresh the doctors list
      await fetchDoctors();
      
      // Show success message
      setSuccessMessage(selectedDoctor ? 'Doctor updated successfully!' : 'Doctor created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving doctor:', err);
      console.error('Error response:', err.response?.data);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDoctor = async () => {
    setModalLoading(true);
    try {
      console.log('Deleting doctor:', selectedDoctor._id);
      
      const response = await api.delete(`/api/doctors/${selectedDoctor._id}`);

      console.log('Delete response:', response.data);

      // Refresh the doctors list
      await fetchDoctors();
      setIsDeleteModalOpen(false);
      setSelectedDoctor(null);
      
      // Show success message
      setSuccessMessage('Doctor deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting doctor:', err);
      console.error('Error response:', err.response?.data);
      setErrorMessage('Error deleting doctor. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  // Modal handlers
  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setIsModalOpen(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsModalOpen(true);
  };

  const handleViewSchedule = (doctor) => {
    setSelectedDoctor(doctor);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteClick = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsScheduleModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedDoctor(null);
  };

  const filteredDoctors = Array.isArray(doctors) ? doctors.filter(doctor => {
    const matchesSearch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterSpecialization === 'all') return matchesSearch;
    return matchesSearch && doctor.specialization === filterSpecialization;
  }) : [];

  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container-responsive">
        <div className="alert alert-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 alert alert-success">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="card-title">Doctors</h1>
              <p className="text-secondary-600">
                {user?.role === 'patient' 
                  ? 'Browse available doctors and their specializations' 
                  : 'Manage doctor information and schedules'
                }
              </p>
            </div>
            {canPerformAction(user?.role, 'create', 'doctors') && (
              <button className="btn btn-primary" onClick={handleAddDoctor}>
                <FaPlus className="mr-2" />
                Add Doctor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FaFilter className="text-secondary-400" />
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className="form-input"
              >
                <option value="all">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Doctor List</h2>
            <span className="text-sm text-secondary-500">
              {filteredDoctors.length} of {doctors.length} doctors
            </span>
          </div>
        </div>
        <div className="card-body">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-secondary-300">
                <FaUserMd className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">No doctors found</h3>
              <p className="mt-2 text-sm text-secondary-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new doctor.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button className="btn btn-primary" onClick={handleAddDoctor}>
                    <FaPlus className="mr-2" />
                    Add First Doctor
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <div key={doctor._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-secondary-200">
                  <div className="p-6">
                    {/* Doctor Header */}
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary-600">
                          {doctor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 truncate">{doctor.name}</h3>
                        <p className="text-sm text-secondary-500">{doctor.specialization}</p>
                      </div>
                    </div>

                    {/* Doctor Information */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm">
                        <FaEnvelope className="h-4 w-4 text-secondary-400 mr-2 flex-shrink-0" />
                        <span className="text-secondary-600 truncate">{doctor.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaPhone className="h-4 w-4 text-secondary-400 mr-2 flex-shrink-0" />
                        <span className="text-secondary-600">{doctor.contact}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaGraduationCap className="h-4 w-4 text-secondary-400 mr-2 flex-shrink-0" />
                        <span className="text-secondary-600">{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="h-4 w-4 text-secondary-400 mr-2 flex-shrink-0" style={{fontSize: '16px'}}>&#8377;</span>
                        <span className="text-secondary-600">₹{doctor.consultationFee}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge ${doctor.isAvailable ? 'badge-success' : 'badge-warning'}`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {doctor.rating !== undefined && (
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-3 w-3 ${i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-xs text-secondary-500">
                            {doctor.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-secondary-200">
                      <button
                        onClick={() => handleViewDoctor(doctor)}
                        className="text-primary-600 hover:text-primary-700 p-2 rounded hover:bg-primary-50 transition-colors"
                        title="View Details"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewSchedule(doctor)}
                        className="text-secondary-600 hover:text-secondary-700 p-2 rounded hover:bg-secondary-50 transition-colors"
                        title="View Schedule"
                      >
                        <FaCalendarAlt className="h-4 w-4" />
                      </button>
                      {canPerformAction(user?.role, 'update', 'doctors') && (
                        <button
                          onClick={() => handleEditDoctor(doctor)}
                          className="text-green-600 hover:text-green-700 p-2 rounded hover:bg-green-50 transition-colors"
                          title="Edit Doctor"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                      )}
                      {canPerformAction(user?.role, 'delete', 'doctors') && (
                        <button
                          onClick={() => handleDeleteClick(doctor)}
                          className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                          title="Delete Doctor"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DoctorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        doctor={selectedDoctor}
        onSave={handleSaveDoctor}
      />

      <DoctorDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeModal}
        doctor={selectedDoctor}
      />

      <DoctorScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={closeModal}
        doctor={selectedDoctor}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModal}
        onConfirm={handleDeleteDoctor}
        item={selectedDoctor}
        itemType="doctor"
        loading={modalLoading}
      />
    </div>
  );
};

export default Doctors;
