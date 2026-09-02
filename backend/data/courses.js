const crypto = require("crypto");

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

const ALLOWED_UPDATE_FIELDS = new Set([
  "title",
  "description",
  "institution",
  "instructor",
  "difficulty",
  "estimatedDuration",
  "prerequisites",
  "tags",
  "isActive",
  "scenarios",
  "learningObjectives",
]);

function normalizeText(value, maxLength = 300) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeStringArray(value, maxItems = 20, itemMaxLength = 60) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => normalizeText(item, itemMaxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    ),
  ];
}

function normalizeDifficulty(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 1;
  return n;
}

function normalizeDuration(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5000) return 60;
  return n;
}

function generateCourseId() {
  return `course_${crypto.randomUUID()}`;
}

function cloneCourse(course) {
  return course ? JSON.parse(JSON.stringify(course)) : null;
}

function getAllCourses({ activeOnly = false } = {}) {
  const result = activeOnly ? courses.filter((course) => course.isActive) : courses;
  return result.map((course) => cloneCourse(course));
}

function getCourse(courseId) {
  const course = courses.find((course) => course.id === courseId) || null;
  return cloneCourse(course);
}

function getCoursesByInstitution(institution) {
  const safeInstitution = String(institution || "").toLowerCase().trim();

  return courses
    .filter((course) => course.institution.toLowerCase() === safeInstitution)
    .map((course) => cloneCourse(course));
}

function getCoursesByInstructor(instructor) {
  const safeInstructor = String(instructor || "").toLowerCase().trim();

  return courses
    .filter((course) => course.instructor.toLowerCase() === safeInstructor)
    .map((course) => cloneCourse(course));
}

function getCoursesByDifficulty(difficulty) {
  const safeDifficulty = Number(difficulty);

  return courses
    .filter((course) => course.difficulty === safeDifficulty)
    .map((course) => cloneCourse(course));
}

function isCourseCompleted(courseId, userProgress = {}) {
  const course = courses.find((item) => item.id === courseId);
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

function getAvailableCoursesForUser(userProgress = {}) {
  const completedCourseIds = getCompletedCourseIds(userProgress);

  return courses
    .filter((course) => course.isActive)
    .filter((course) =>
      course.prerequisites.every((prereq) => completedCourseIds.includes(prereq))
    )
    .map((course) => cloneCourse(course));
}

function getCourseProgress(courseId, userProgress = {}) {
  const course = courses.find((item) => item.id === courseId);
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
    courseId: course.id,
    title: course.title,
    totalScenarios: course.scenarios.length,
    completedScenarios: completedScenarios.length,
    progressPercentage: Math.round(completionRatio * 100),
    estimatedTimeRemaining: Math.max(
      0,
      Math.round(course.estimatedDuration * (1 - completionRatio))
    ),
    nextScenario:
      course.scenarios.find(
        (scenarioId) => progress[scenarioId]?.status !== "completed"
      ) || null,
    isCompleted: completionRatio === 1,
  };
}

function getRecommendedCourses(userProgress = {}) {
  const availableCourses = getAvailableCoursesForUser(userProgress);
  const userLevel = Number(userProgress.level) || 1;

  return availableCourses
    .filter((course) => course.difficulty <= userLevel + 1)
    .sort((a, b) => {
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      return a.estimatedDuration - b.estimatedDuration;
    })
    .slice(0, 3)
    .map((course) => cloneCourse(course));
}

function validatePrerequisites(prerequisites, currentCourseId = null) {
  if (!Array.isArray(prerequisites)) return [];

  const safePrerequisites = normalizeStringArray(prerequisites, 20, 80).filter(
    (id) => id !== currentCourseId
  );

  return safePrerequisites.filter((id) =>
    courses.some((course) => course.id === id)
  );
}

function isDuplicateCourseTitle(title, excludedCourseId = null) {
  const safeTitle = normalizeText(title, 120).toLowerCase();
  if (!safeTitle) return false;

  return courses.some(
    (course) =>
      course.id !== excludedCourseId &&
      course.title.trim().toLowerCase() === safeTitle
  );
}

function createCourse(courseData = {}) {
  const title = normalizeText(courseData.title || "Untitled Course", 120);

  if (isDuplicateCourseTitle(title)) {
    return {
      success: false,
      error: "A course with the same title already exists",
    };
  }

  const newCourse = {
    id: generateCourseId(),
    title,
    description: normalizeText(courseData.description || "", 1000),
    institution: normalizeText(courseData.institution || "CyberMind University", 120),
    instructor: normalizeText(courseData.instructor || "admin", 80),
    difficulty: normalizeDifficulty(courseData.difficulty),
    estimatedDuration: normalizeDuration(courseData.estimatedDuration),
    prerequisites: validatePrerequisites(courseData.prerequisites || []),
    tags: normalizeStringArray(courseData.tags || [], 20, 40),
    isActive: typeof courseData.isActive === "boolean" ? courseData.isActive : true,
    createdAt: new Date().toISOString(),
    scenarios: normalizeStringArray(courseData.scenarios || [], 50, 80),
    learningObjectives: normalizeStringArray(
      courseData.learningObjectives || [],
      20,
      200
    ),
  };

  courses.push(newCourse);

  return {
    success: true,
    course: cloneCourse(newCourse),
  };
}

function updateCourse(courseId, updates = {}) {
  const courseIndex = courses.findIndex((course) => course.id === courseId);
  if (courseIndex === -1) return null;

  const safeUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) continue;

    switch (key) {
      case "title": {
        const safeTitle = normalizeText(value, 120);
        if (safeTitle && !isDuplicateCourseTitle(safeTitle, courseId)) {
          safeUpdates.title = safeTitle;
        }
        break;
      }

      case "description":
        safeUpdates.description = normalizeText(value, 1000);
        break;

      case "institution":
        safeUpdates.institution = normalizeText(value, 120);
        break;

      case "instructor":
        safeUpdates.instructor = normalizeText(value, 80);
        break;

      case "difficulty":
        safeUpdates.difficulty = normalizeDifficulty(value);
        break;

      case "estimatedDuration":
        safeUpdates.estimatedDuration = normalizeDuration(value);
        break;

      case "prerequisites":
        safeUpdates.prerequisites = validatePrerequisites(value, courseId);
        break;

      case "tags":
        safeUpdates.tags = normalizeStringArray(value, 20, 40);
        break;

      case "scenarios":
        safeUpdates.scenarios = normalizeStringArray(value, 50, 80);
        break;

      case "learningObjectives":
        safeUpdates.learningObjectives = normalizeStringArray(value, 20, 200);
        break;

      case "isActive":
        if (typeof value === "boolean") {
          safeUpdates.isActive = value;
        }
        break;

      default:
        break;
    }
  }

  courses[courseIndex] = {
    ...courses[courseIndex],
    ...safeUpdates,
  };

  return cloneCourse(courses[courseIndex]);
}

module.exports = {
  courses,
  getAllCourses,
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