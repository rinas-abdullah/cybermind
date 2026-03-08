// Course/Scenario Management - Institutional learning paths
// TODO: Replace with database when upgrading to MongoDB/MySQL
// Future schema: Courses collection/table

const courses = [
  {
    id: "basic-cybersecurity",
    title: "Basic Cybersecurity Fundamentals",
    description:
      "Introduction to cybersecurity concepts, threats, and basic defense strategies",
    institution: "CyberMind University",
    instructor: "CyberFox",
    difficulty: 1,
    estimatedDuration: 120,
    prerequisites: [],
    tags: ["fundamentals", "beginner", "theory"],
    isActive: true,
    createdAt: new Date().toISOString(),
    scenarios: ["basic-commands", "file-permissions"],
    learningObjectives: [
      "Understand basic cybersecurity concepts",
      "Identify common threats",
      "Apply basic security practices",
    ],
  },
  {
    id: "network-security",
    title: "Network Security and Defense",
    description:
      "Advanced network security concepts including firewalls, intrusion detection, and secure protocols",
    institution: "CyberMind University",
    instructor: "CyberFox",
    difficulty: 3,
    estimatedDuration: 240,
    prerequisites: ["basic-cybersecurity"],
    tags: ["network", "advanced", "practical"],
    isActive: true,
    createdAt: new Date().toISOString(),
    scenarios: ["network-scanning", "firewall-config", "intrusion-detection"],
    learningObjectives: [
      "Configure network security controls",
      "Detect and respond to network intrusions",
      "Implement secure network architectures",
    ],
  },
  {
    id: "web-application-security",
    title: "Web Application Security",
    description:
      "Secure web application development and common vulnerability assessment",
    institution: "CyberMind University",
    instructor: "admin",
    difficulty: 2,
    estimatedDuration: 180,
    prerequisites: ["basic-cybersecurity"],
    tags: ["web", "development", "owasp"],
    isActive: true,
    createdAt: new Date().toISOString(),
    scenarios: ["web-vulnerabilities", "sql-injection", "xss-attacks"],
    learningObjectives: [
      "Identify web application vulnerabilities",
      "Implement secure coding practices",
      "Conduct basic security assessments",
    ],
  },
  {
    id: "advanced-exploitation",
    title: "Advanced Exploitation Techniques",
    description:
      "Advanced penetration testing and exploitation methodologies for security professionals",
    institution: "CyberMind University",
    instructor: "admin",
    difficulty: 4,
    estimatedDuration: 300,
    prerequisites: ["network-security", "web-application-security"],
    tags: ["advanced", "pentesting", "expert"],
    isActive: true,
    createdAt: new Date().toISOString(),
    scenarios: ["advanced-exploitation", "privilege-escalation", "post-exploitation"],
    learningObjectives: [
      "Perform advanced penetration testing",
      "Exploit complex vulnerabilities",
      "Maintain persistent access ethically",
    ],
  },
];

// ==================================================
// BASIC HELPERS
// ==================================================

function getCourse(courseId) {
  return courses.find((course) => course.id === courseId) || null;
}

function getCoursesByInstitution(institution) {
  return courses.filter(
    (course) =>
      course.institution.toLowerCase() === String(institution).toLowerCase()
  );
}

function getCoursesByInstructor(instructor) {
  return courses.filter(
    (course) =>
      course.instructor.toLowerCase() === String(instructor).toLowerCase()
  );
}

function getCoursesByDifficulty(difficulty) {
  return courses.filter((course) => course.difficulty === difficulty);
}

// ==================================================
// COURSE PROGRESS HELPERS
// ==================================================

function isCourseCompleted(courseId, userProgress = {}) {
  const course = getCourse(courseId);
  if (!course) return false;

  const progress = userProgress.progress || {};

  return course.scenarios.every(
    (scenarioId) => progress[scenarioId]?.status === "completed"
  );
}

function getCompletedCourseIds(userProgress = {}) {
  return courses
    .filter((course) => isCourseCompleted(course.id, userProgress))
    .map((course) => course.id);
}

function getAvailableCoursesForUser(username, userProgress = {}) {
  const completedCourseIds = getCompletedCourseIds(userProgress);

  return courses.filter((course) => {
    return course.prerequisites.every((prereq) =>
      completedCourseIds.includes(prereq)
    );
  });
}

function getCourseProgress(username, courseId, userProgress = {}) {
  const course = getCourse(courseId);
  if (!course) return null;

  const progress = userProgress.progress || {};

  const completedScenarios = course.scenarios.filter(
    (scenarioId) => progress[scenarioId]?.status === "completed"
  );

  const completionRatio =
    course.scenarios.length > 0
      ? completedScenarios.length / course.scenarios.length
      : 0;

  return {
    courseId,
    title: course.title,
    totalScenarios: course.scenarios.length,
    completedScenarios: completedScenarios.length,
    progressPercentage: Math.round(completionRatio * 100),
    estimatedTimeRemaining: Math.round(
      course.estimatedDuration * (1 - completionRatio)
    ),
    nextScenario: course.scenarios.find(
      (scenarioId) => progress[scenarioId]?.status !== "completed"
    ) || null,
    isCompleted: completionRatio === 1,
  };
}

function getRecommendedCourses(username, userProgress = {}) {
  const availableCourses = getAvailableCoursesForUser(username, userProgress);
  const userLevel = userProgress.level || 1;

  return availableCourses
    .filter((course) => course.difficulty <= userLevel + 1)
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, 3);
}

// ==================================================
// COURSE MANAGEMENT
// ==================================================

function createCourse(courseData) {
  const newCourse = {
    id: generateCourseId(),
    title: courseData.title || "Untitled Course",
    description: courseData.description || "",
    institution: courseData.institution || "CyberMind University",
    instructor: courseData.instructor || "admin",
    difficulty: courseData.difficulty || 1,
    estimatedDuration: courseData.estimatedDuration || 60,
    prerequisites: courseData.prerequisites || [],
    tags: courseData.tags || [],
    isActive: courseData.isActive ?? true,
    createdAt: new Date().toISOString(),
    scenarios: courseData.scenarios || [],
    learningObjectives: courseData.learningObjectives || [],
  };

  courses.push(newCourse);
  return newCourse;
}

function updateCourse(courseId, updates) {
  const courseIndex = courses.findIndex((course) => course.id === courseId);
  if (courseIndex === -1) return null;

  courses[courseIndex] = {
    ...courses[courseIndex],
    ...updates,
  };

  return courses[courseIndex];
}

function generateCourseId() {
  return `course_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  courses,
  getCourse,
  getCoursesByInstitution,
  getCoursesByInstructor,
  getCoursesByDifficulty,
  isCourseCompleted,
  getCompletedCourseIds,
  getAvailableCoursesForUser,
  getCourseProgress,
  getRecommendedCourses,
  createCourse,
  updateCourse,
};