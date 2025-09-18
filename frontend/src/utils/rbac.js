// Role-Based Access Control utilities

// Define permissions for different roles
const rolePermissions = {
  admin: {
    patients: ['create', 'read', 'update', 'delete'],
    doctors: ['create', 'read', 'update', 'delete'],
    appointments: ['create', 'read', 'update', 'delete'],
    medicalRecords: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete']
  },
  doctor: {
    patients: ['read', 'update'],
    doctors: ['read'],
    appointments: ['create', 'read', 'update', 'delete'],
    medicalRecords: ['create', 'read', 'update', 'delete'],
    users: ['read']
  },
  patient: {
    patients: ['read'],
    doctors: ['read'],
    appointments: ['create', 'read', 'update', 'delete'],
    medicalRecords: ['read'],
    users: []
  }
};

/**
 * Check if a user role can perform a specific action on a resource
 * @param {string} role - User role (admin, doctor, patient)
 * @param {string} action - Action to perform (create, read, update, delete)
 * @param {string} resource - Resource type (patients, doctors, appointments, medicalRecords, users)
 * @returns {boolean} - Whether the action is allowed
 */
export const canPerformAction = (role, action, resource) => {
  if (!role || !action || !resource) {
    return false;
  }

  const permissions = rolePermissions[role];
  if (!permissions) {
    return false;
  }

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(action);
};

/**
 * Check if a user role is admin
 * @param {string} role - User role
 * @returns {boolean} - Whether the role is admin
 */
export const isAdmin = (role) => {
  return role === 'admin';
};

/**
 * Check if a user role is doctor
 * @param {string} role - User role
 * @returns {boolean} - Whether the role is doctor
 */
export const isDoctor = (role) => {
  return role === 'doctor';
};

/**
 * Check if a user role is patient
 * @param {string} role - User role
 * @returns {boolean} - Whether the role is patient
 */
export const isPatient = (role) => {
  return role === 'patient';
};

/**
 * Filter navigation items based on user role
 * @param {Array} navigation - Array of navigation items
 * @param {string} role - User role
 * @returns {Array} - Filtered navigation items
 */
export const filterNavigationByRole = (navigation, role) => {
  if (!role || !navigation) {
    return [];
  }

  return navigation.filter(item => {
    // If no roles specified, item is visible to all
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    
    // Check if user role is in allowed roles
    return item.roles.includes(role);
  });
};

/**
 * Get all available roles
 * @returns {Array} - Array of available roles
 */
export const getAvailableRoles = () => {
  return ['admin', 'doctor', 'patient'];
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} - Display name for the role
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    admin: 'Administrator',
    doctor: 'Doctor',
    patient: 'Patient'
  };
  
  return roleNames[role] || role;
};

/**
 * Get role color class for UI
 * @param {string} role - Role key
 * @returns {string} - CSS class for role styling
 */
export const getRoleColorClass = (role) => {
  const roleColors = {
    admin: 'text-red-600 bg-red-100',
    doctor: 'text-blue-600 bg-blue-100',
    patient: 'text-green-600 bg-green-100'
  };
  
  return roleColors[role] || 'text-gray-600 bg-gray-100';
};
