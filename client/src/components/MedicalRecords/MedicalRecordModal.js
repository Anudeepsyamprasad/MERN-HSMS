import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaUserMd, FaStethoscope, FaPills, FaCalendar, FaFileAlt, FaHeartbeat, FaWeight, FaThermometerHalf, FaTint } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const MedicalRecordModal = ({ isOpen, onClose, medicalRecord = null, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    symptoms: [],
    treatment: '',
    medications: [],
    notes: '',
    followUpDate: '',
    visitDate: '',
    // Vital Signs
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    // Additional fields
    severity: 'mild',
    allergies: [],
    currentMedications: [],
    familyHistory: '',
    socialHistory: {
      smoking: false,
      alcohol: false,
      occupation: '',
      lifestyle: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [currentMedicationInput, setCurrentMedicationInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPatientsAndDoctors();
    }
  }, [isOpen]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (medicalRecord) {
        // Edit mode - populate with existing data
        setFormData({
          patientId: medicalRecord.patient?._id || '',
          doctorId: medicalRecord.doctor?._id || '',
          diagnosis: medicalRecord.diagnosis || '',
          symptoms: medicalRecord.symptoms || [],
          treatment: medicalRecord.treatmentPlan || medicalRecord.treatment || '',
          medications: medicalRecord.medications || [],
          notes: medicalRecord.notes || '',
          followUpDate: medicalRecord.followUpDate ? new Date(medicalRecord.followUpDate).toISOString().split('T')[0] : '',
          visitDate: medicalRecord.visitDate ? new Date(medicalRecord.visitDate).toISOString().split('T')[0] : (medicalRecord.date ? new Date(medicalRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          // Vital Signs
          bloodPressureSystolic: medicalRecord.vitalSigns?.bloodPressure?.systolic || '',
          bloodPressureDiastolic: medicalRecord.vitalSigns?.bloodPressure?.diastolic || '',
          heartRate: medicalRecord.vitalSigns?.heartRate || '',
          temperature: medicalRecord.vitalSigns?.temperature || '',
          respiratoryRate: medicalRecord.vitalSigns?.respiratoryRate || '',
          oxygenSaturation: medicalRecord.vitalSigns?.oxygenSaturation || '',
          weight: medicalRecord.vitalSigns?.weight || '',
          height: medicalRecord.vitalSigns?.height || '',
          // Additional fields
          severity: medicalRecord.severity || 'mild',
          allergies: medicalRecord.allergies || [],
          currentMedications: medicalRecord.currentMedications || [],
          familyHistory: medicalRecord.familyHistory || '',
          socialHistory: {
            smoking: medicalRecord.socialHistory?.smoking || false,
            alcohol: medicalRecord.socialHistory?.alcohol || false,
            occupation: medicalRecord.socialHistory?.occupation || '',
            lifestyle: medicalRecord.socialHistory?.lifestyle || ''
          }
        });
      } else {
        // Add mode - reset form
        setFormData({
          patientId: '',
          doctorId: '',
          diagnosis: '',
          symptoms: [],
          treatment: '',
          medications: [],
          notes: '',
          followUpDate: '',
          visitDate: new Date().toISOString().split('T')[0],
          // Vital Signs
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          heartRate: '',
          temperature: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          height: '',
          // Additional fields
          severity: 'mild',
          allergies: [],
          currentMedications: [],
          familyHistory: '',
          socialHistory: {
            smoking: false,
            alcohol: false,
            occupation: '',
            lifestyle: ''
          }
        });
      }
      setErrors({});
    }
  }, [isOpen, medicalRecord]);

  // Ensure form data is properly set when patients/doctors are loaded
  useEffect(() => {
    if (medicalRecord && isOpen && patients.length > 0 && doctors.length > 0) {
      // Only update if the IDs don't match
      if (formData.patientId !== medicalRecord.patient?._id || formData.doctorId !== medicalRecord.doctor?._id) {
        setFormData(prev => ({
          ...prev,
          patientId: medicalRecord.patient?._id || '',
          doctorId: medicalRecord.doctor?._id || ''
        }));
      }
    }
  }, [medicalRecord, isOpen, patients, doctors, formData.patientId, formData.doctorId]);

  // Auto-select current doctor if user is a doctor
  useEffect(() => {
    if (user?.role === 'doctor' && doctors.length > 0 && !formData.doctorId) {
      // Find the doctor record that matches the current user
      const currentDoctor = doctors.find(doctor => 
        doctor.user === user._id || doctor.email === user.email
      );
      
      if (currentDoctor) {
        console.log('Auto-selecting current doctor:', currentDoctor);
        setFormData(prev => ({
          ...prev,
          doctorId: currentDoctor._id
        }));
      }
    }
  }, [user, doctors, formData.doctorId]);

  const fetchPatientsAndDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Fetching patients and doctors for user role:', user?.role);

      // For patients, we don't need to fetch patients list since they can only create records for themselves
      if (user?.role === 'patient') {
        // Only fetch doctors
        const doctorsResponse = await fetch('/api/doctors', { headers });
        const doctorsData = await doctorsResponse.json();
        const doctorsArray = doctorsData.doctors || doctorsData || [];
        console.log('Fetched doctors for patient:', doctorsArray);
        setDoctors(doctorsArray);
        setPatients([]); // No patients list needed for patients
      } else {
        // For admin and doctor users, fetch both patients and doctors
        const [patientsResponse, doctorsResponse] = await Promise.all([
          fetch('/api/patients', { headers }),
          fetch('/api/doctors', { headers })
        ]);

        const patientsData = await patientsResponse.json();
        const doctorsData = await doctorsResponse.json();

        const patientsArray = patientsData.patients || patientsData || [];
        const doctorsArray = doctorsData.doctors || doctorsData || [];

        console.log('Fetched patients:', patientsArray);
        console.log('Fetched doctors:', doctorsArray);

        setPatients(patientsArray);
        setDoctors(doctorsArray);
      }
    } catch (error) {
      console.error('Error fetching patients and doctors:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Set empty arrays on error to prevent map errors
      setPatients([]);
      setDoctors([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Only require patient selection for admin and doctor users
    if (user?.role !== 'patient' && !formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }

    if (!formData.doctorId) {
      newErrors.doctorId = 'Doctor is required';
    }

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }

    if (!formData.treatment.trim()) {
      newErrors.treatment = 'Treatment is required';
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required';
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
      console.log('Form data before processing:', formData);
      console.log('User role:', user?.role);
      
      const processedData = {
        doctorId: formData.doctorId,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        treatment: formData.treatment,
        medications: formData.medications,
        notes: formData.notes,
        followUpDate: formData.followUpDate || null,
        visitDate: formData.visitDate,
        vitalSigns: {
          bloodPressure: {
            systolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
            diastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null
          },
          heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
          oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null
        },
        severity: formData.severity,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
        familyHistory: formData.familyHistory,
        socialHistory: formData.socialHistory
      };

      // Only include patientId for admin and doctor users
      if (user?.role !== 'patient') {
        if (!formData.patientId) {
          throw new Error('Patient selection is required');
        }
        processedData.patientId = formData.patientId;
      }
      
      console.log('Processed data being sent:', processedData);
      await onSave(processedData);
      onClose();
    } catch (error) {
      console.error('Error saving medical record:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.message === 'Patient selection is required') {
        setErrors({ patientId: 'Please select a patient' });
      } else if (error.response?.data?.message) {
        setErrors({ general: `Error: ${error.response.data.message}` });
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setErrors({ general: `Validation Error: ${errorMessages}` });
      } else {
        setErrors({ general: 'An error occurred while saving the medical record. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('socialHistory.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialHistory: {
          ...prev.socialHistory,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !formData.symptoms.includes(symptomInput.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (index) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (medicationInput.trim() && !formData.medications.includes(medicationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, medicationInput.trim()]
      }));
      setMedicationInput('');
    }
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addCurrentMedication = () => {
    if (currentMedicationInput.trim() && !formData.currentMedications.includes(currentMedicationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, currentMedicationInput.trim()]
      }));
      setCurrentMedicationInput('');
    }
  };

  const removeCurrentMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, padding: '10px' }}>
      <div className="bg-white rounded shadow-lg" style={{ 
        width: '100%', 
        maxWidth: window.innerWidth < 768 ? '95vw' : '1200px', 
        height: window.innerWidth < 768 ? '95vh' : '90vh', 
        maxHeight: window.innerWidth < 768 ? '95vh' : '800px',
        minHeight: window.innerWidth < 768 ? '500px' : '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Fixed Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom bg-light" style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 className="h4 mb-0 text-dark fw-bold">
            {medicalRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
          </h3>
          <button onClick={onClose} className="btn btn-outline-secondary btn-sm p-2" style={{ minWidth: '40px' }}>
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3" style={{ 
          flex: 1, 
          overflowY: 'auto',
          minHeight: 0,
          padding: window.innerWidth < 768 ? '15px' : '20px'
        }}>
          {errors.general && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Patient Selection - Only show for admin and doctor users */}
              {user?.role !== 'patient' && (
                <div className="col-12 col-md-6">
                  <label className="form-label">
                    <FaUser className="me-2" />
                    Patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId || ''}
                    onChange={handleChange}
                    className={`form-select ${errors.patientId ? 'is-invalid' : ''}`}
                    key={`patient-${formData.patientId || 'empty'}`}
                  >
                    <option value="">Select Patient</option>
                    {Array.isArray(patients) && patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
                  {errors.patientId && <div className="invalid-feedback">{errors.patientId}</div>}
                </div>
              )}

              {/* Doctor Selection */}
              <div className="col-12 col-md-6">
                <label className="form-label">
                  <FaUserMd className="me-2" />
                  Doctor *
                </label>
                <select
                  name="doctorId"
                  value={formData.doctorId || ''}
                  onChange={handleChange}
                  className={`form-select ${errors.doctorId ? 'is-invalid' : ''}`}
                  key={`doctor-${formData.doctorId || 'empty'}`}
                >
                  <option value="">Select Doctor</option>
                  {Array.isArray(doctors) && doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} ({doctor.specialization})
                    </option>
                  ))}
                </select>
                {errors.doctorId && <div className="invalid-feedback">{errors.doctorId}</div>}
              </div>

              {/* Visit Date */}
              <div className="col-12 col-md-6">
                <label className="form-label">
                  <FaCalendar className="me-2" />
                  Visit Date *
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className={`form-control ${errors.visitDate ? 'is-invalid' : ''}`}
                />
                {errors.visitDate && <div className="invalid-feedback">{errors.visitDate}</div>}
              </div>

              {/* Severity */}
              <div className="col-12 col-md-6">
                <label className="form-label">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Diagnosis */}
              <div className="col-12">
                <label className="form-label">
                  <FaStethoscope className="me-2" />
                  Diagnosis *
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  className={`form-control ${errors.diagnosis ? 'is-invalid' : ''}`}
                  placeholder="Enter diagnosis"
                  rows="3"
                />
                {errors.diagnosis && <div className="invalid-feedback">{errors.diagnosis}</div>}
              </div>

              {/* Symptoms */}
              <div className="col-12">
                <label className="form-label">Symptoms</label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="Add symptom"
                    className="form-control"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                  />
                  <button type="button" onClick={addSymptom} className="btn btn-outline-secondary">
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.symptoms.map((symptom, index) => (
                    <span key={index} className="badge bg-primary d-flex align-items-center">
                      {symptom}
                      <button
                        type="button"
                        onClick={() => removeSymptom(index)}
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.7em' }}
                      >
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Treatment */}
              <div className="col-12">
                <label className="form-label">
                  <FaFileAlt className="me-2" />
                  Treatment *
                </label>
                <textarea
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                  className={`form-control ${errors.treatment ? 'is-invalid' : ''}`}
                  placeholder="Enter treatment plan"
                  rows="3"
                />
                {errors.treatment && <div className="invalid-feedback">{errors.treatment}</div>}
              </div>

              {/* Medications */}
              <div className="col-12">
                <label className="form-label">
                  <FaPills className="me-2" />
                  Medications
                </label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    value={medicationInput}
                    onChange={(e) => setMedicationInput(e.target.value)}
                    placeholder="Add medication"
                    className="form-control"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                  />
                  <button type="button" onClick={addMedication} className="btn btn-outline-secondary">
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.medications.map((medication, index) => (
                    <span key={index} className="badge bg-success d-flex align-items-center">
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.7em' }}
                      >
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Vital Signs Section */}
              <div className="col-12">
                <h4 className="h6 text-dark mb-3 d-flex align-items-center">
                  <FaHeartbeat className="me-2" />
                  Vital Signs
                </h4>
                <div className="row g-3">
                  {/* Blood Pressure */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Blood Pressure (mmHg)</label>
                    <div className="d-flex gap-2 align-items-center">
                      <input
                        type="number"
                        name="bloodPressureSystolic"
                        value={formData.bloodPressureSystolic}
                        onChange={handleChange}
                        placeholder="Systolic"
                        min="0"
                        max="300"
                        className="form-control"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        name="bloodPressureDiastolic"
                        value={formData.bloodPressureDiastolic}
                        onChange={handleChange}
                        placeholder="Diastolic"
                        min="0"
                        max="200"
                        className="form-control"
                      />
                    </div>
                  </div>

                  {/* Heart Rate */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      placeholder="Heart rate"
                      min="0"
                      max="300"
                      className="form-control"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Temperature (°F)</label>
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="Temperature"
                      min="90"
                      max="110"
                      step="0.1"
                      className="form-control"
                    />
                  </div>

                  {/* Respiratory Rate */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Respiratory Rate (breaths/min)</label>
                    <input
                      type="number"
                      name="respiratoryRate"
                      value={formData.respiratoryRate}
                      onChange={handleChange}
                      placeholder="Respiratory rate"
                      min="0"
                      max="60"
                      className="form-control"
                    />
                  </div>

                  {/* Oxygen Saturation */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={formData.oxygenSaturation}
                      onChange={handleChange}
                      placeholder="Oxygen saturation"
                      min="0"
                      max="100"
                      className="form-control"
                    />
                  </div>

                  {/* Weight */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="Weight"
                      min="0"
                      max="500"
                      step="0.1"
                      className="form-control"
                    />
                  </div>

                  {/* Height */}
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="Height"
                      min="0"
                      max="300"
                      step="0.1"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className="col-12">
                <label className="form-label">Allergies</label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="Add allergy"
                    className="form-control"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  />
                  <button type="button" onClick={addAllergy} className="btn btn-outline-secondary">
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <span key={index} className="badge bg-danger d-flex align-items-center">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.7em' }}
                      >
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Medications */}
              <div className="col-12">
                <label className="form-label">Current Medications</label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentMedicationInput}
                    onChange={(e) => setCurrentMedicationInput(e.target.value)}
                    placeholder="Add current medication"
                    className="form-control"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCurrentMedication())}
                  />
                  <button type="button" onClick={addCurrentMedication} className="btn btn-outline-secondary">
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.currentMedications.map((medication, index) => (
                    <span key={index} className="badge bg-warning text-dark d-flex align-items-center">
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeCurrentMedication(index)}
                        className="btn-close ms-1"
                        style={{ fontSize: '0.7em' }}
                      >
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Family History */}
              <div className="col-12">
                <label className="form-label">Family History</label>
                <textarea
                  name="familyHistory"
                  value={formData.familyHistory}
                  onChange={handleChange}
                  placeholder="Enter family medical history"
                  rows="3"
                  className="form-control"
                />
              </div>

              {/* Social History */}
              <div className="col-12">
                <label className="form-label">Social History</label>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="socialHistory.smoking"
                        checked={formData.socialHistory.smoking}
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <label className="form-check-label">Smoking</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="socialHistory.alcohol"
                        checked={formData.socialHistory.alcohol}
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <label className="form-check-label">Alcohol</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Occupation</label>
                    <input
                      type="text"
                      name="socialHistory.occupation"
                      value={formData.socialHistory.occupation}
                      onChange={handleChange}
                      placeholder="Occupation"
                      className="form-control"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Lifestyle</label>
                    <input
                      type="text"
                      name="socialHistory.lifestyle"
                      value={formData.socialHistory.lifestyle}
                      onChange={handleChange}
                      placeholder="Lifestyle habits"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes"
                  rows="4"
                  className="form-control"
                />
              </div>

              {/* Follow-up Date */}
              <div className="col-12 col-md-6">
                <label className="form-label">Follow-up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="form-control"
                />
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
                {medicalRecord ? 'Update Record' : 'Add Record'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordModal;
