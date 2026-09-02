// Institutional Analytics - Progress tracking and reporting for universities/training centers
// Analytics service for statistics and reporting; PostgreSQL integration planned for production.

const { getUserProgress, progressData } = require("../data/progress");
const { getUserRole, getUsersByInstitution } = require("../data/userRoles");
const { getCoursesByInstitution, getCourseProgress, getRecommendedCourses } = require("../data/courses");
const { getAllDemoUsers, getDemoUserByUsername } = require("../data/users");

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function findUser(username) {
  if (typeof getDemoUserByUsername === "function") {
    return getDemoUserByUsername(username);
  }

  const users = typeof getAllDemoUsers === "function" ? getAllDemoUsers() : [];
  return users.find((u) => u.username === username) || null;
}

function generateInstitutionReport(institution = "CyberMind University") {
  const institutionUsers = getUsersByInstitution(institution);
  const courses = getCoursesByInstitution(institution);

  const report = {
    institution,
    generatedAt: new Date().toISOString(),
    summary: {
      totalUsers: institutionUsers.length,
      totalCourses: courses.length,
      activeUsers: 0,
      completionRate: 0,
      averageScore: 0,
    },
    userBreakdown: {
      students: 0,
      instructors: 0,
      admins: 0,
    },
    courseAnalytics: [],
    topPerformers: [],
    recentActivity: [],
  };

  let totalScore = 0;
  let activeUsersCount = 0;
  let totalCompletions = 0;
  let totalPossibleCompletions = 0;

  institutionUsers.forEach((userRole) => {
    const progress = getUserProgress(userRole.username);
    const user = findUser(userRole.username);

    if (user) {
      totalScore += safeNumber(user.points, 0);
      activeUsersCount++;
    }

    if (userRole.role === "student") report.userBreakdown.students++;
    if (userRole.role === "instructor") report.userBreakdown.instructors++;
    if (userRole.role === "admin") report.userBreakdown.admins++;

    if (progress) {
      totalCompletions += safeArray(progress.completedScenarios).length;
      totalPossibleCompletions += courses.reduce(
        (sum, course) => sum + safeArray(course.scenarios).length,
        0
      );

      report.recentActivity.push({
        username: userRole.username,
        role: userRole.role,
        lastActivity: progress.lastActivity,
        currentScenario: progress.currentScenario || null,
        completedScenarios: safeArray(progress.completedScenarios).length,
      });
    }
  });

  report.summary.activeUsers = activeUsersCount;
  report.summary.averageScore =
    activeUsersCount > 0 ? Math.round(totalScore / activeUsersCount) : 0;
  report.summary.completionRate =
    totalPossibleCompletions > 0
      ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
      : 0;

  courses.forEach((course) => {
    const courseAnalytics = {
      courseId: course.id,
      title: course.title,
      difficulty: course.difficulty,
      enrolledUsers: 0,
      completedUsers: 0,
      averageScore: 0,
      averageTime: 0,
    };

    const courseScores = [];
    const courseTimes = [];

    institutionUsers.forEach((userRole) => {
      const progress = getUserProgress(userRole.username);
      if (!progress) return;

      const userCourseProgress = getCourseProgress(course.id, progress);
      if (!userCourseProgress) return;

      courseAnalytics.enrolledUsers++;

      if (userCourseProgress.isCompleted) {
        courseAnalytics.completedUsers++;

        const taskScores = safeArray(course.scenarios)
          .map((scenarioId) => progress.progress?.[scenarioId]?.score || 0)
          .filter((score) => score > 0);

        const taskTimes = safeArray(course.scenarios)
          .map((scenarioId) => progress.progress?.[scenarioId]?.timeSpent || 0)
          .filter((time) => time > 0);

        if (taskScores.length > 0) {
          courseScores.push(
            Math.round(taskScores.reduce((a, b) => a + b, 0) / taskScores.length)
          );
        }

        if (taskTimes.length > 0) {
          courseTimes.push(taskTimes.reduce((a, b) => a + b, 0));
        }
      }
    });

    if (courseScores.length > 0) {
      courseAnalytics.averageScore = Math.round(
        courseScores.reduce((a, b) => a + b, 0) / courseScores.length
      );
    }

    if (courseTimes.length > 0) {
      courseAnalytics.averageTime = Math.round(
        courseTimes.reduce((a, b) => a + b, 0) / courseTimes.length
      );
    }

    report.courseAnalytics.push(courseAnalytics);
  });

  const userScores = institutionUsers
    .map((userRole) => {
      const user = findUser(userRole.username);
      return {
        username: userRole.username,
        role: userRole.role,
        score: user ? safeNumber(user.points, 0) : 0,
        level: user ? safeNumber(user.level, 0) : 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  report.topPerformers = userScores.slice(0, 10);
  report.recentActivity = report.recentActivity
    .sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
    .slice(0, 10);

  return report;
}

function generateUserReport(username) {
  const user = findUser(username);
  const progress = getUserProgress(username);
  const userRole = getUserRole(username);

  if (!user) return null;

  const institution = userRole?.institution || "Unknown";

  const report = {
    username,
    role: userRole?.role || "student",
    institution,
    generatedAt: new Date().toISOString(),
    currentStats: {
      level: safeNumber(user.level, 0),
      totalScore: safeNumber(user.points, 0),
      currentStreak: safeNumber(progress?.streak, 0),
      achievements: safeArray(progress?.achievements),
    },
    progress: {
      completedScenarios: safeArray(progress?.completedScenarios),
      currentScenario: progress?.currentScenario || null,
      adaptiveDifficulty: safeNumber(progress?.adaptiveDifficulty, 1),
    },
    courseProgress: [],
    recommendations: [],
  };

  const courses = getCoursesByInstitution(institution);

  courses.forEach((course) => {
    const courseProgress = getCourseProgress(course.id, progress || {});
    if (courseProgress) {
      report.courseProgress.push(courseProgress);
    }
  });

  report.recommendations = getRecommendedCourses(progress || {});
  return report;
}

function generateComplianceReport(institution = "CyberMind University") {
  const institutionUsers = getUsersByInstitution(institution);

  const report = {
    institution,
    generatedAt: new Date().toISOString(),
    compliance: {
      totalUsers: institutionUsers.length,
      activeUsers: 0,
      inactiveUsers: 0,
      usersWithProgress: 0,
      averageEngagement: 0,
    },
    securityMetrics: {
      uniqueLogins: institutionUsers.length,
      sessionHealth: "good",
      dataRetention: "compliant",
    },
    trainingCompliance: {
      requiredCourses: 0,
      completedRequired: 0,
      overdueTraining: 0,
    },
  };

  let totalEngagement = 0;

  institutionUsers.forEach((userRole) => {
    const progress = getUserProgress(userRole.username);
    if (progress) {
      report.compliance.usersWithProgress++;
      totalEngagement += safeArray(progress.completedScenarios).length;
    }
  });

  report.compliance.activeUsers = report.compliance.usersWithProgress;
  report.compliance.inactiveUsers =
    institutionUsers.length - report.compliance.activeUsers;
  report.compliance.averageEngagement =
    report.compliance.usersWithProgress > 0
      ? Math.round(totalEngagement / report.compliance.usersWithProgress)
      : 0;

  return report;
}

function getEngagementMetrics(timeframe = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - safeNumber(timeframe, 30));

  const metrics = {
    timeframe: safeNumber(timeframe, 30),
    totalUsers: safeArray(progressData).length,
    activeUsers: 0,
    newUsers: 0,
    returningUsers: 0,
    averageSessionTime: 0,
    topScenarios: {},
  };

  let totalSessionTime = 0;
  const scenarioCompletions = {};

  safeArray(progressData).forEach((progress) => {
    const lastActivity = new Date(progress.lastActivity);

    if (lastActivity >= cutoffDate) {
      metrics.activeUsers++;
    }

    Object.entries(progress.progress || {}).forEach(([scenarioId, scenario]) => {
      totalSessionTime += safeNumber(scenario.timeSpent, 0);

      if (scenario.status === "completed") {
        scenarioCompletions[scenarioId] =
          (scenarioCompletions[scenarioId] || 0) + 1;
      }
    });
  });

  metrics.returningUsers = metrics.activeUsers;
  metrics.averageSessionTime =
    metrics.activeUsers > 0 ? Math.round(totalSessionTime / metrics.activeUsers) : 0;

  const sortedScenarios = Object.entries(scenarioCompletions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  metrics.topScenarios = Object.fromEntries(sortedScenarios);

  return metrics;
}

module.exports = {
  generateInstitutionReport,
  generateUserReport,
  generateComplianceReport,
  getEngagementMetrics,
};