// User Roles and Permissions - Institutional user management
// TODO: Replace with database when upgrading to MongoDB/MySQL
// Future schema: UserRoles collection/table
// - id (ObjectId/auto-increment)
// - user_id (foreign key)
// - role (enum: 'student', 'instructor', 'admin')
// - institution_id (for multi-tenant)
// - assigned_at (timestamp)
// - assigned_by (user_id)

const userRoles = [
  {
    username: "admin",
    role: "admin",
    institution: "CyberMind University",
    assignedAt: new Date().toISOString(),
    assignedBy: "system",
    permissions: ["manage_users", "manage_courses", "view_analytics", "manage_institution"]
  },
  {
    username: "CyberFox",
    role: "instructor",
    institution: "CyberMind University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: ["view_student_progress", "manage_assignments", "grade_submissions"]
  },
  {
    username: "guest",
    role: "student",
    institution: "CyberMind University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: ["take_courses", "view_own_progress"]
  },
  {
    username: "NetRunner",
    role: "student",
    institution: "CyberMind University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: ["take_courses", "view_own_progress"]
  }
];

// Default permissions by role
const ROLE_PERMISSIONS = {
  admin: [
    "manage_users",
    "manage_courses",
    "view_analytics",
    "manage_institution",
    "view_all_progress",
    "manage_roles",
    "system_admin"
  ],
  instructor: [
    "view_student_progress",
    "manage_assignments",
    "grade_submissions",
    "create_courses",
    "view_class_analytics"
  ],
  student: [
    "take_courses",
    "view_own_progress",
    "submit_assignments"
  ]
};

// Helper functions
function getUserRole(username) {
  return userRoles.find(role => role.username.toLowerCase() === username.toLowerCase());
}

function hasPermission(username, permission) {
  const userRole = getUserRole(username);
  if (!userRole) return false;

  return userRole.permissions.includes(permission);
}

function getUsersByRole(role) {
  return userRoles.filter(userRole => userRole.role === role);
}

function getUsersByInstitution(institution) {
  return userRoles.filter(userRole => userRole.institution === institution);
}

function assignRole(username, role, assignedBy, institution = "CyberMind University") {
  // Remove existing role if any
  userRoles = userRoles.filter(r => r.username !== username);

  // Add new role
  const newRole = {
    username,
    role,
    institution,
    assignedAt: new Date().toISOString(),
    assignedBy,
    permissions: ROLE_PERMISSIONS[role] || []
  };

  userRoles.push(newRole);
  return newRole;
}

function getRoleStats() {
  const stats = {
    total: userRoles.length,
    byRole: {},
    byInstitution: {}
  };

  userRoles.forEach(userRole => {
    // Count by role
    stats.byRole[userRole.role] = (stats.byRole[userRole.role] || 0) + 1;

    // Count by institution
    stats.byInstitution[userRole.institution] = (stats.byInstitution[userRole.institution] || 0) + 1;
  });

  return stats;
}

module.exports = {
  userRoles,
  ROLE_PERMISSIONS,
  getUserRole,
  hasPermission,
  getUsersByRole,
  getUsersByInstitution,
  assignRole,
  getRoleStats
};