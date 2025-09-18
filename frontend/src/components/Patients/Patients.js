import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import LoadingSpinner from '../UI/LoadingSpinner';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaFilter } from 'react-icons/fa';
import PatientModal from './PatientModal';
import DeleteConfirmModal from '../UI/DeleteConfirmModal';
import PatientDetailsModal from './PatientDetailsModal';
import './Patients.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/api/patients');

      // Handle the response structure from the backend
      const data = response.data;
      setPatients(data.patients || data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.response?.data?.message || 'Failed to fetch patients');
      setPatients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = Array.isArray(patients) ? patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.contact?.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && patient.isActive === (filterStatus === 'active');
  }) : [];

  // CRUD Operations
  const handleAddPatient = () => {
    setSelectedPatient(null);
    setShowModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleDeletePatient = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const handleSavePatient = async (formData) => {
    setModalLoading(true);
    try {
      if (selectedPatient) {
        // Update existing patient
        await api.put(`/api/patients/${selectedPatient._id}`, formData);
      } else {
        // Create new patient
        await api.post('/api/patients', formData);
      }

      // Refresh the patients list
      await fetchPatients();
      
      // Show success message (you can add toast notifications here)
      console.log(`Patient ${selectedPatient ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving patient:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);
    try {
      await api.delete(`/api/patients/${selectedPatient._id}`);

      // Refresh the patients list
      await fetchPatients();
      
      // Show success message
      console.log('Patient deleted successfully');
      setShowDeleteModal(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
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
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between">
            <div>
              <h1 className="card-title">Patients</h1>
              <p className="text-secondary-600">Manage patient information and records</p>
            </div>
            <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddPatient}>
              <FaPlus className="mr-2" />
              Add Patient
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 text-sm"
              />
            </div>
            <div className="flex items-center space-x-3">
              <FaFilter className="h-4 w-4 text-secondary-400 flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input text-sm"
              >
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <h2 className="card-title">Patient List</h2>
            <span className="text-sm text-secondary-500">
              {filteredPatients.length} of {patients.length} patients
            </span>
          </div>
        </div>
        <div className="card-body">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-secondary-300">
                <FaSearch className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">No patients found</h3>
              <p className="mt-2 text-sm text-secondary-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new patient.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button className="btn btn-primary" onClick={handleAddPatient}>
                    <FaPlus className="mr-2" />
                    Add First Patient
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPatients.map((patient) => (
                <div key={patient._id} className="card patient-card">
                  <div className="card-body">
                    <div className="flex items-center mb-4">
                      <div className="patient-avatar">
                        <span>
                          {patient.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-secondary-900 truncate">{patient.name}</h3>
                        <p className="text-sm text-secondary-500">ID: {patient._id.slice(-6)}</p>
                      </div>
                    </div>
                    
                    <div className="patient-details">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-secondary-700">Age:</span>
                          <span className="text-sm font-bold text-secondary-900">
                            {patient.age !== undefined && patient.age !== null ? patient.age : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-secondary-700">Gender:</span>
                          <span className="text-sm font-bold text-secondary-900 capitalize">{patient.gender}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-secondary-700">Contact:</span>
                          <span className="text-sm font-bold text-secondary-900 truncate">{patient.contact}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-secondary-700">Status:</span>
                          <span className={`badge ${patient.isActive ? 'badge-success' : 'badge-warning'}`}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="patient-actions">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          className="action-button text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          title="View Details"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button
                          className="action-button text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                          title="Edit Patient"
                          onClick={() => handleEditPatient(patient)}
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="action-button text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Patient"
                          onClick={() => handleDeletePatient(patient)}
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PatientModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onSave={handleSavePatient}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPatient(null);
        }}
        item={selectedPatient}
        itemType="patient"
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
      />

      <PatientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </div>
  );
};

export default Patients;
