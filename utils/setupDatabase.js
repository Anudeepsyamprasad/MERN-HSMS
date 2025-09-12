const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
require('dotenv').config({ path: './config.env' });

// Database setup and seeding script
async function setupDatabase() {
  try {
    console.log('Setting up database...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Clear existing data (optional - uncomment if you want to start fresh)
    // await clearDatabase();
    
    // Create users with proper roles
    await createUsers();
    
    // Create patient records linked to patient users
    await createPatients();
    
    // Create doctor records linked to doctor users
    await createDoctors();
    
    // Create sample appointments
    await createSampleAppointments();
    
    // Create sample medical records
    await createSampleMedicalRecords();
    
    console.log('Database setup completed successfully!');
    console.log('\n Created:');
    console.log('   - 3 Users (admin, doctor, patient)');
    console.log('   - 1 Patient record');
    console.log('   - 1 Doctor record');
    console.log('   - Sample appointments');
    console.log('   - Sample medical records');
    
    console.log('\n Test Credentials:');
    console.log('   Admin: admin@hospital.com / admin123');
    console.log('   Doctor: doctor1@hospital.com / doctor123');
    console.log('   Patient: patient1@hospital.com / patient123');
    
  } catch (error) {
    console.error(' Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Clear all data from database
async function clearDatabase() {
  console.log(' Clearing existing data...');
  
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Appointment.deleteMany({});
  await MedicalRecord.deleteMany({});
  
  console.log('Database cleared');
}

// Create users with proper roles
async function createUsers() {
  console.log('\n Creating users...');
  
  const users = [
    {
      username: 'admin',
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      username: 'doctor1',
      email: 'doctor1@hospital.com',
      password: 'doctor123',
      role: 'doctor'
    },
    {
      username: 'patient1',
      email: 'patient1@hospital.com',
      password: 'patient123',
      role: 'patient'
    }
  ];
  
  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`  User ${userData.email} already exists`);
        continue;
      }
      
      const user = new User(userData);
      await user.save();
      console.log(` Created user: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.log(`Failed to create user ${userData.email}: ${error.message}`);
    }
  }
}

// Create patient records linked to patient users
async function createPatients() {
  console.log('\n Creating patient records...');
  
  const patientUsers = await User.find({ role: 'patient' });
  
  for (const user of patientUsers) {
    try {
      // Check if patient record already exists
      const existingPatient = await Patient.findOne({ 
        $or: [
          { user: user._id },
          { email: user.email }
        ]
      });
      
      if (existingPatient) {
        console.log(` Patient record for ${user.email} already exists`);
        continue;
      }
      
      const patientData = {
        user: user._id,
        name: user.username || user.email.split('@')[0],
        email: user.email,
        contact: '+918837384122',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Other',
        address: '123 Main Street, City, Anakapalle 12345',
        bloodGroup: 'O+',
        emergencyContact: '+999999229399',
        medicalHistory: 'No significant medical history',
        isActive: true
      };
      
      const patient = new Patient(patientData);
      await patient.save();
      console.log(`Created patient record for: ${user.email}`);
    } catch (error) {
      console.log(`Failed to create patient for ${user.email}: ${error.message}`);
    }
  }
}

// Create doctor records linked to doctor users
async function createDoctors() {
  console.log('\n Creating doctor records...');
  
  const doctorUsers = await User.find({ role: 'doctor' });
  
  for (const user of doctorUsers) {
    try {
      // Check if doctor record already exists
      const existingDoctor = await Doctor.findOne({ 
        $or: [
          { user: user._id },
          { email: user.email }
        ]
      });
      
      if (existingDoctor) {
        console.log(` Doctor record for ${user.email} already exists`);
        continue;
      }
      
      const doctorData = {
        user: user._id,
        name: `Dr. ${user.username}`,
        email: user.email,
        contact: '+15550000002',
        specialization: 'General Medicine',
        licenseNumber: `MD${user._id.toString().slice(-6)}`,
        experience: 5,
        education: 'Medical School',
        address: '456 Hospital Drive, City, State 12345',
        consultationFee: 8000,
        isAvailable: true,
        schedule: [
          { day: 'monday', from: '09:00', to: '17:00', isAvailable: true },
          { day: 'tuesday', from: '09:00', to: '17:00', isAvailable: true },
          { day: 'wednesday', from: '09:00', to: '17:00', isAvailable: true },
          { day: 'thursday', from: '09:00', to: '17:00', isAvailable: true },
          { day: 'friday', from: '09:00', to: '17:00', isAvailable: true }
        ]
      };
      
      const doctor = new Doctor(doctorData);
      await doctor.save();
      console.log(`Created doctor record for: ${user.email}`);
    } catch (error) {
      console.log(`Failed to create doctor for ${user.email}: ${error.message}`);
    }
  }
}

// Create sample appointments
async function createSampleAppointments() {
  console.log('\n Creating sample appointments...');
  
  try {
    const patient = await Patient.findOne({ email: 'patient1@hospital.com' });
    const doctor = await Doctor.findOne({ email: 'doctor1@hospital.com' });
    
    if (!patient || !doctor) {
      console.log(' Cannot create sample appointments - missing patient or doctor');
      return;
    }
    
    // Check if appointments already exist
    const existingAppointments = await Appointment.countDocuments();
    if (existingAppointments > 0) {
      console.log(`${existingAppointments} appointments already exist`);
      return;
    }
    
    const appointments = [
      {
        patient: patient._id,
        doctor: doctor._id,
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 30,
        status: 'booked',
        type: 'consultation',
        reason: 'Regular checkup',
        notes: 'Patient requested routine examination',
        paymentStatus: 'pending',
        amount: 8000
      },
      {
        patient: patient._id,
        doctor: doctor._id,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        duration: 45,
        status: 'booked',
        type: 'follow-up',
        reason: 'Follow-up appointment',
        notes: 'Follow-up from previous consultation',
        paymentStatus: 'pending',
        amount: 8000
      }
    ];
    
    for (const appointmentData of appointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
    }
    
    console.log(` Created ${appointments.length} sample appointments`);
  } catch (error) {
    console.log(` Failed to create sample appointments: ${error.message}`);
  }
}

// Create sample medical records
async function createSampleMedicalRecords() {
  console.log('\n Creating sample medical records...');
  
  try {
    const patient = await Patient.findOne({ email: 'patient1@hospital.com' });
    const doctor = await Doctor.findOne({ email: 'doctor1@hospital.com' });
    
    if (!patient || !doctor) {
      console.log(' Cannot create sample medical records - missing patient or doctor');
      return;
    }
    
    // Check if medical records already exist
    const existingRecords = await MedicalRecord.countDocuments();
    if (existingRecords > 0) {
      console.log(` ${existingRecords} medical records already exist`);
      return;
    }
    
    const medicalRecords = [
      {
        patient: patient._id,
        doctor: doctor._id,
        diagnosis: 'Hypertension',
        symptoms: ['High blood pressure', 'Headaches', 'Dizziness'],
        treatmentPlan: 'Lifestyle modifications and medication',
        notes: 'Patient shows signs of stage 1 hypertension. Recommend dietary changes and regular monitoring.',
        vitalSigns: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 75,
          temperature: 98.6,
          weight: 70,
          height: 170
        },
        severity: 'moderate',
        allergies: ['Penicillin'],
        currentMedications: ['Lisinopril 10mg'],
        familyHistory: 'Father had heart disease',
        socialHistory: {
          smoking: false,
          alcohol: false,
          occupation: 'Office worker',
          lifestyle: 'Sedentary'
        },
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    ];
    
    for (const recordData of medicalRecords) {
      const medicalRecord = new MedicalRecord(recordData);
      await medicalRecord.save();
    }
    
    console.log(` Created ${medicalRecords.length} sample medical records`);
  } catch (error) {
    console.log(` Failed to create sample medical records: ${error.message}`);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  clearDatabase,
  createUsers,
  createPatients,
  createDoctors,
  createSampleAppointments,
  createSampleMedicalRecords
};
