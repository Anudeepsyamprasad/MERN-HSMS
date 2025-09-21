import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import LoadingSpinner from '../UI/LoadingSpinner';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter, FaFileMedical } from 'react-icons/fa';
import { format } from 'date-fns';
import MedicalRecordModal from './MedicalRecordModal';
import MedicalRecordDetailsModal from './MedicalRecordDetailsModal';
import DeleteConfirmModal from '../UI/DeleteConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { canPerformAction } from '../../utils/rbac';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/medical-records');

      // Handle the response structure from the backend
      const data = response.data;
      setMedicalRecords(Array.isArray(data) ? data : (data.medicalRecords || []));
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.response?.data?.message || 'Failed to fetch medical records');
      setMedicalRecords([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicalRecords = Array.isArray(medicalRecords) ? medicalRecords.filter(record => {
    const matchesSearch = record.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterPatient === 'all') return matchesSearch;
    return matchesSearch && record.patient?.name === filterPatient;
  }) : [];

  const patients = Array.isArray(medicalRecords) ? [...new Set(medicalRecords.map(record => record.patient?.name))] : [];

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

  // CRUD Operations
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setShowModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(false); // Close details modal
    setShowModal(true); // Open edit modal
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleSaveRecord = async (formData) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('MedicalRecords handleSaveRecord called with:', formData);
      console.log('User role:', user?.role);

      if (selectedRecord) {
        // Update existing record
        console.log('Updating existing record:', selectedRecord._id);
        await api.put(`/api/medical-records/${selectedRecord._id}`, formData);
      } else {
        // Create new record
        console.log('Creating new record with data:', formData);
        const response = await api.post('/api/medical-records', formData);
        console.log('Create response:', response.data);
      }

      // Refresh the records list
      await fetchMedicalRecords();
      
      // Trigger dashboard refresh
      triggerRefresh();
      
      // Close modal and reset selected record
      setShowModal(false);
      setSelectedRecord(null);
      
      // Show success message (you can add toast notifications here)
      console.log(`Medical record ${selectedRecord ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving medical record:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error; // Re-throw to be handled by the modal
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/medical-records/${selectedRecord._id}`);

      // Refresh the records list
      await fetchMedicalRecords();
      
      // Trigger dashboard refresh
      triggerRefresh();
      
      // Show success message
      console.log('Medical record deleted successfully');
      setShowDeleteModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      // You can add error handling here
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
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      {/* Header */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="card-title">Medical Records</h1>
              <p className="text-secondary-600">
                {user?.role === 'patient' 
                  ? 'View your medical records (created by doctors and admins)' 
                  : 'Manage patient medical records and history'
                }
              </p>
            </div>
            {canPerformAction(user?.role, 'create', 'medicalRecords') && (
              <button className="btn btn-primary" onClick={handleAddRecord}>
                <FaPlus className="mr-2" />
                Add Record
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
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FaFilter className="text-secondary-400" />
              <select
                value={filterPatient}
                onChange={(e) => setFilterPatient(e.target.value)}
                className="form-input"
              >
                <option value="all">All Patients</option>
                {Array.isArray(patients) && patients.map(patient => (
                  <option key={patient} value={patient}>{patient}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Records List */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <h2 className="card-title">Medical Records List</h2>
            <span className="text-sm text-secondary-500">
              {filteredMedicalRecords.length} of {medicalRecords.length} records
            </span>
          </div>
        </div>
        <div className="card-body">
          {filteredMedicalRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-secondary-300">
                <FaFileMedical className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">No medical records found</h3>
              <p className="mt-2 text-sm text-secondary-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : user?.role === 'patient' 
                    ? 'You don\'t have any medical records yet. Add your first record to get started.'
                    : 'Get started by adding a new medical record.'
                }
              </p>
              {!searchTerm && canPerformAction(user?.role, 'create', 'medicalRecords') && (
                <div className="mt-6">
                  {canPerformAction(user?.role, 'create', 'medicalRecords') && (
                    <button className="btn btn-primary" onClick={handleAddRecord}>
                      <FaPlus className="mr-2" />
                      Add First Record
                    </button>
                  )}
                  {user?.role === 'patient' && (
                    <p className="text-secondary-600 mt-4">
                      No medical records found. Records will appear here once a doctor or admin creates them for you.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Diagnosis</th>
                    <th>Visit Date</th>
                    <th>Medications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicalRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-secondary-50">
                      <td>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">
                              {record.patient?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-secondary-900">
                              {record.patient?.name}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {record.patient?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{record.doctor?.name}</div>
                        <div className="text-sm text-secondary-500">{record.doctor?.specialization}</div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900 max-w-xs truncate">{record.diagnosis}</div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900">{formatDate(record.visitDate || record.date)}</div>
                      </td>
                      <td>
                        <div className="text-sm text-secondary-900 max-w-xs truncate">
                          {record.medications?.join(', ')}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-primary-600 hover:text-primary-700 p-1 rounded"
                            title="View Details"
                            onClick={() => handleViewRecord(record)}
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          {canPerformAction(user?.role, 'update', 'medicalRecords') && (
                            <button
                              className="text-secondary-600 hover:text-secondary-700 p-1 rounded"
                              title="Edit Record"
                              onClick={() => handleEditRecord(record)}
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          )}
                          {canPerformAction(user?.role, 'delete', 'medicalRecords') && (
                            <button
                              className="text-red-600 hover:text-red-700 p-1 rounded"
                              title="Delete Record"
                              onClick={() => handleDeleteRecord(record)}
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
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
      <MedicalRecordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        medicalRecord={selectedRecord}
        onSave={handleSaveRecord}
      />

      <MedicalRecordDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        medicalRecord={selectedRecord}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
      />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          item={selectedRecord}
          itemType="medicalRecord"
          onConfirm={handleConfirmDelete}
          loading={modalLoading}
        />
    </div>
  );
};

export default MedicalRecords;
