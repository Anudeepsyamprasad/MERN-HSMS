const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

/**
 * Sync user data when patient/doctor records are updated
 * This ensures authentication continues to work after admin updates
 */
const syncUserData = async (recordType, recordId, updateData, originalEmail) => {
  try {
    console.log(`\n=== SYNC USER DATA DEBUG ===`);
    console.log(`Record Type: ${recordType}`);
    console.log(`Record ID: ${recordId}`);
    console.log(`Update Data:`, updateData);
    console.log(`Original Email: ${originalEmail}`);
    
    let record;
    
    if (recordType === 'patient') {
      record = await Patient.findById(recordId);
    } else if (recordType === 'doctor') {
      record = await Doctor.findById(recordId);
    } else {
      throw new Error('Invalid record type. Must be "patient" or "doctor"');
    }
    
    if (!record || !record.user) {
      console.log('Record not found or not linked to user');
      return { success: false, message: 'Record not found or not linked to user' };
    }
    
    console.log(`Found record: ${record.name} (${record.email})`);
    console.log(`Linked user ID: ${record.user}`);
    
    const userUpdateData = {};
    
    // If email was changed, update user email
    if (updateData.email && updateData.email !== originalEmail) {
      userUpdateData.email = updateData.email;
    }
    
    // If name was changed, update username (if it matches the old email pattern)
    if (updateData.name && updateData.name !== record.name) {
      const user = await User.findById(record.user);
      if (user && user.username === originalEmail.split('@')[0]) {
        userUpdateData.username = updateData.name.toLowerCase().replace(/\s+/g, '_');
      }
    }
    
    // If username was explicitly provided, update it
    if (updateData.username) {
      userUpdateData.username = updateData.username;
    }
    
    // If password was provided, update it
    if (updateData.password) {
      console.log(`Password provided: "${updateData.password}" (length: ${updateData.password.length})`);
      userUpdateData.password = updateData.password;
    } else {
      console.log('No password provided in update data');
    }
    
    // Ensure user is active when patient is updated
    userUpdateData.isActive = true;
    
    // Update user record if there are changes
    if (Object.keys(userUpdateData).length > 0) {
      const updatedFields = { ...userUpdateData };
      
      // Get the user and update all fields in one operation
      const user = await User.findById(record.user);
      if (user) {
        // Update all fields including password
        Object.keys(userUpdateData).forEach(key => {
          if (key === 'password') {
            user.password = userUpdateData[key]; // This triggers the virtual setter for hashing
          } else {
            user[key] = userUpdateData[key];
          }
        });
        
        await user.save();
        console.log(`Updated linked user record for ${recordType} ${recordId} with:`, updatedFields);
        return { success: true, updatedFields: updatedFields };
      }
    }
    
    return { success: true, message: 'No user data changes needed' };
  } catch (error) {
    console.error(`Error syncing user data for ${recordType} ${recordId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Fix existing data inconsistencies between User and Patient/Doctor records
 */
const fixDataInconsistencies = async () => {
  try {
    console.log(' Starting data consistency fix...\n');
    
    // Fix patient-user inconsistencies
    console.log('1. Fixing patient-user email inconsistencies...');
    const patients = await Patient.find({ user: { $exists: true } }).populate('user');
    let patientsFixed = 0;
    
    for (const patient of patients) {
      if (patient.user && patient.email !== patient.user.email) {
        try {
          await User.findByIdAndUpdate(patient.user._id, { email: patient.email });
          console.log(`  Fixed patient "${patient.name}": ${patient.user.email} → ${patient.email}`);
          patientsFixed++;
        } catch (error) {
          console.log(`  Failed to fix patient "${patient.name}": ${error.message}`);
        }
      }
    }
    
    console.log(` Fixed ${patientsFixed} patient email inconsistencies\n`);
    
    // Fix doctor-user inconsistencies
    console.log('2. Fixing doctor-user email inconsistencies...');
    const doctors = await Doctor.find({ user: { $exists: true } }).populate('user');
    let doctorsFixed = 0;
    
    for (const doctor of doctors) {
      if (doctor.user && doctor.email !== doctor.user.email) {
        try {
          await User.findByIdAndUpdate(doctor.user._id, { email: doctor.email });
          console.log(`Fixed doctor "${doctor.name}": ${doctor.user.email} → ${doctor.email}`);
          doctorsFixed++;
        } catch (error) {
          console.log(` Failed to fix doctor "${doctor.name}": ${error.message}`);
        }
      }
    }
    
    console.log(`Fixed ${doctorsFixed} doctor email inconsistencies\n`);
    
    console.log('Data consistency fix completed!');
    return { success: true, patientsFixed, doctorsFixed };
  } catch (error) {
    console.error('Error during data consistency fix:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  syncUserData,
  fixDataInconsistencies
};
