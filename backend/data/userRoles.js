// User Roles and Permissions - Institutional user management

const ROLE_PERMISSIONS = Object.freeze({
  admin: Object.freeze([
    "manage_users",
    "manage_courses",
    "view_analytics",
    "manage_institution",
    "view_all_progress",
    "manage_roles",
    "system_admin",
  ]),
  instructor: Object.freeze([
    "view_student_progress",
    "manage_assignments",
    "grade_submissions",
    "create_courses",
    "view_class_analytics",
  ]),
  learner: Object.freeze([
    "take_courses",
    "view_own_progress",
    "submit_assignments",
  ]),
});

const ALLOWED_ROLES = new Set(Object.keys(ROLE_PERMISSIONS));

const userRoles = [
  {
    username: "admin",
    role: "admin",
    institution: "Risaq University",
    assignedAt: new Date().toISOString(),
    assignedBy: "system",
    permissions: [...ROLE_PERMISSIONS.admin],
  },
  {
    username: "CyberFox",
    role: "instructor",
    institution: "Risaq University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: [...ROLE_PERMISSIONS.instructor],
  },
  {
    username: "guest",
    role: "learner",
    institution: "Risaq University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: [...ROLE_PERMISSIONS.learner],
  },
  {
    username: "NetRunner",
    role: "learner",
    institution: "Risaq University",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    permissions: [...ROLE_PERMISSIONS.learner],
  },
];

function normalizeText(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeUsername(username) {
  return normalizeText(username, 50);
}

function normalizeRole(role) {
  return normalizeText(role, 30).toLowerCase();
}

function normalizeInstitution(institution) {
  return normalizeText(institution, 120);
}

function normalizePermission(permission) {
  return normalizeText(permission, 80);
}

function cloneRoleEntry(entry) {
  if (!entry) return null;

  return {
    ...entry,
    permissions: Array.isArray(entry.permissions) ? [...entry.permissions] : [],
  };
}

function getPermissionsForRole(role) {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole]
    ? [...ROLE_PERMISSIONS[normalizedRole]]
    : [];
}

function getAllRoleAssignments() {
  return userRoles.map((entry) => cloneRoleEntry(entry));
}

function getUserRole(username) {
  const normalizedUsername = normalizeUsername(username).toLowerCase();
  if (!normalizedUsername) return null;

  const found =
    userRoles.find(
      (entry) => entry.username.toLowerCase() === normalizedUsername
    ) || null;

  return cloneRoleEntry(found);
}

function hasPermission(username, permission) {
  const userRole = getUserRole(username);
  if (!userRole) return false;

  const normalizedPermission = normalizePermission(permission);
  if (!normalizedPermission) return false;

  const effectivePermissions = getPermissionsForRole(userRole.role);
  return effectivePermissions.includes(normalizedPermission);
}

function getUsersByRole(role) {
  const normalizedRole = normalizeRole(role);

  return userRoles
    .filter((entry) => entry.role === normalizedRole)
    .map((entry) => cloneRoleEntry(entry));
}

function getUsersByInstitution(institution) {
  const normalizedInstitution = normalizeInstitution(institution).toLowerCase();

  return userRoles
    .filter(
      (entry) => entry.institution.toLowerCase() === normalizedInstitution
    )
    .map((entry) => cloneRoleEntry(entry));
}

function assignRole(
  username,
  role,
  assignedBy,
  institution = "Risaq University"
) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedRole = normalizeRole(role);
  const normalizedAssignedBy = normalizeText(assignedBy, 50);
  const normalizedInstitution = normalizeInstitution(institution);

  if (!normalizedUsername) {
    return { success: false, error: "Username is required" };
  }

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    return { success: false, error: "Invalid role" };
  }

  const existingIndex = userRoles.findIndex(
    (entry) => entry.username.toLowerCase() === normalizedUsername.toLowerCase()
  );

  const roleAssignment = {
    username: normalizedUsername,
    role: normalizedRole,
    institution: normalizedInstitution || "Risaq University",
    assignedAt: new Date().toISOString(),
    assignedBy: normalizedAssignedBy || "system",
    permissions: getPermissionsForRole(normalizedRole),
  };

  if (existingIndex >= 0) {
    userRoles[existingIndex] = roleAssignment;
  } else {
    userRoles.push(roleAssignment);
  }

  return {
    success: true,
    roleAssignment: cloneRoleEntry(roleAssignment),
  };
}

function removeRole(username) {
  const normalizedUsername = normalizeUsername(username).toLowerCase();
  if (!normalizedUsername) {
    return { success: false, error: "Username is required" };
  }

  const index = userRoles.findIndex(
    (entry) => entry.username.toLowerCase() === normalizedUsername
  );

  if (index === -1) {
    return { success: false, error: "User role assignment not found" };
  }

  const removed = userRoles.splice(index, 1)[0];

  return {
    success: true,
    removed: cloneRoleEntry(removed),
  };
}

function getRoleStats() {
  const stats = {
    total: userRoles.length,
    byRole: {},
    byInstitution: {},
  };

  for (const entry of userRoles) {
    stats.byRole[entry.role] = (stats.byRole[entry.role] || 0) + 1;
    stats.byInstitution[entry.institution] =
      (stats.byInstitution[entry.institution] || 0) + 1;
  }

  return stats;
}

module.exports = {
  userRoles,
  ROLE_PERMISSIONS,
  ALLOWED_ROLES,
  getPermissionsForRole,
  getAllRoleAssignments,
  getUserRole,
  hasPermission,
  getUsersByRole,
  getUsersByInstitution,
  assignRole,
  removeRole,
  getRoleStats,
};