// Role-Based Access Control Utilities

/**
 * Check if user has required role
 * @param {string} userRole - Current user's role
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole || !requiredRoles) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

/**
 * Check if user is admin
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole === 'admin';
};

/**
 * Check if user is doctor
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isDoctor = (userRole) => {
  return userRole === 'doctor';
};

/**
 * Check if user is patient
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isPatient = (userRole) => {
  return userRole === 'patient';
};

/**
 * Check if user can access patients
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAccessPatients = (userRole) => {
  return hasRole(userRole, ['admin', 'doctor']);
};

/**
 * Check if user can access doctors
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAccessDoctors = (userRole) => {
  return hasRole(userRole, ['admin', 'doctor', 'patient']);
};

/**
 * Check if user can manage users
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canManageUsers = (userRole) => {
  return hasRole(userRole, ['admin']);
};

/**
 * Check if user can access appointments
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAccessAppointments = (userRole) => {
  return hasRole(userRole, ['admin', 'doctor', 'patient']);
};

/**
 * Check if user can access medical records
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAccessMedicalRecords = (userRole) => {
  return hasRole(userRole, ['admin', 'doctor', 'patient']);
};


/**
 * Filter navigation items based on user role
 * @param {Array} navigationItems - Array of navigation items
 * @param {string} userRole - Current user's role
 * @returns {Array} Filtered navigation items
 */
export const filterNavigationByRole = (navigationItems, userRole) => {
  return navigationItems.filter(item => {
    if (!item.roles) return true;
    return hasRole(userRole, item.roles);
  });
};

/**
 * Check if user can perform action on resource
 * @param {string} userRole - Current user's role
 * @param {string} action - Action to perform (create, read, update, delete)
 * @param {string} resource - Resource type (patients, doctors, users, etc.)
 * @returns {boolean}
 */
export const canPerformAction = (userRole, action, resource) => {
  const permissions = {
    admin: {
      patients: ['create', 'read', 'update', 'delete'],
      doctors: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      appointments: ['create', 'read', 'update', 'delete'],
      medicalRecords: ['create', 'read', 'update', 'delete']
    },
    doctor: {
      patients: ['create', 'read', 'update'],
      doctors: ['read'],
      users: [],
      appointments: ['create', 'read', 'update'],
      medicalRecords: ['create', 'read', 'update']
    },
    patient: {
      patients: [],
      doctors: ['read'],
      users: [],
      appointments: ['create', 'read', 'delete'],
      medicalRecords: ['read']
    }
  };

  return permissions[userRole]?.[resource]?.includes(action) || false;
};


export default {
  hasRole,
  isAdmin,
  isDoctor,
  isPatient,
  canAccessPatients,
  canAccessDoctors,
  canManageUsers,
  canAccessAppointments,
  canAccessMedicalRecords,
  filterNavigationByRole,
  canPerformAction
};
