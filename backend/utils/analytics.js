// Institutional Analytics - Progress tracking and reporting for universities/training centers
// TODO: Replace with database analytics when upgrading to MongoDB/MySQL

const { getUserProgress } = require('../data/progress');
const { getUserRole, getUsersByInstitution, getUsersByRole } = require('../data/userRoles');
const { getCourse, getCoursesByInstitution } = require('../data/courses');
const users = require('../data/users');

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
      averageScore: 0
    },
    userBreakdown: {
      students: 0,
      instructors: 0,
      admins: 0
    },
    courseAnalytics: [],
    topPerformers: [],
    recentActivity: []
  };

  let totalScore = 0;
  let activeUsersCount = 0;
  let totalCompletions = 0;
  let totalPossibleCompletions = 0;

  // Analyze each user
  institutionUsers.forEach(userRole => {
    const progress = getUserProgress(userRole.username);
    const user = users.find(u => u.username === userRole.username);

    if (user) {
      totalScore += user.points;
      activeUsersCount++;

      // Count by role
      report.userBreakdown[userRole.role + 's']++;

      // Calculate completions
      if (progress) {
        totalCompletions += progress.completedScenarios.length;
        totalPossibleCompletions += courses.reduce((sum, course) => sum + course.scenarios.length, 0);
      }
    }
  });

  // Calculate summary metrics
  report.summary.activeUsers = activeUsersCount;
  report.summary.averageScore = activeUsersCount > 0 ? Math.round(totalScore / activeUsersCount) : 0;
  report.summary.completionRate = totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;

  // Course analytics
  courses.forEach(course => {
    const courseAnalytics = {
      courseId: course.id,
      title: course.title,
      difficulty: course.difficulty,
      enrolledUsers: 0,
      completedUsers: 0,
      averageScore: 0,
      averageTime: 0
    };

    let courseScores = [];
    let courseTimes = [];

    institutionUsers.forEach(userRole => {
      const progress = getUserProgress(userRole.username);
      if (progress && progress.progress[course.id]) {
        courseAnalytics.enrolledUsers++;
        const courseProgress = progress.progress[course.id];

        if (courseProgress.status === 'completed') {
          courseAnalytics.completedUsers++;
          courseScores.push(courseProgress.score);
          courseTimes.push(courseProgress.timeSpent);
        }
      }
    });

    if (courseScores.length > 0) {
      courseAnalytics.averageScore = Math.round(courseScores.reduce((a, b) => a + b, 0) / courseScores.length);
    }

    if (courseTimes.length > 0) {
      courseAnalytics.averageTime = Math.round(courseTimes.reduce((a, b) => a + b, 0) / courseTimes.length);
    }

    report.courseAnalytics.push(courseAnalytics);
  });

  // Top performers
  const userScores = institutionUsers.map(userRole => {
    const user = users.find(u => u.username === userRole.username);
    return {
      username: userRole.username,
      role: userRole.role,
      score: user ? user.points : 0,
      level: user ? user.level : 0
    };
  }).sort((a, b) => b.score - a.score);

  report.topPerformers = userScores.slice(0, 10);

  return report;
}

function generateUserReport(username) {
  const user = users.find(u => u.username === username);
  const progress = getUserProgress(username);
  const userRole = getUserRole(username);

  if (!user) return null;

  const report = {
    username,
    role: userRole?.role || 'student',
    institution: userRole?.institution || 'Unknown',
    generatedAt: new Date().toISOString(),
    currentStats: {
      level: user.level,
      totalScore: user.points,
      currentStreak: progress?.streak || 0,
      achievements: progress?.achievements || []
    },
    progress: {
      completedScenarios: progress?.completedScenarios || [],
      currentScenario: progress?.currentScenario || null,
      adaptiveDifficulty: progress?.adaptiveDifficulty || 1
    },
    courseProgress: [],
    recommendations: []
  };

  // Calculate course progress
  const courses = getCoursesByInstitution(userRole?.institution || "CyberMind University");
  courses.forEach(course => {
    const courseProgress = getCourseProgress(username, course.id, progress);
    if (courseProgress) {
      report.courseProgress.push(courseProgress);
    }
  });

  // Get recommendations
  const { getRecommendedCourses } = require('./courses');
  report.recommendations = getRecommendedCourses(username, progress);

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
      averageEngagement: 0
    },
    securityMetrics: {
      uniqueLogins: institutionUsers.length,
      sessionHealth: 'good', // Would be calculated from session data
      dataRetention: 'compliant'
    },
    trainingCompliance: {
      requiredCourses: 0,
      completedRequired: 0,
      overdueTraining: 0
    }
  };

  // Calculate compliance metrics
  let totalEngagement = 0;

  institutionUsers.forEach(userRole => {
    const progress = getUserProgress(userRole.username);
    if (progress) {
      report.compliance.usersWithProgress++;
      totalEngagement += progress.completedScenarios.length;
    }
  });

  report.compliance.activeUsers = report.compliance.usersWithProgress;
  report.compliance.inactiveUsers = institutionUsers.length - report.compliance.activeUsers;
  report.compliance.averageEngagement = report.compliance.usersWithProgress > 0
    ? Math.round(totalEngagement / report.compliance.usersWithProgress)
    : 0;

  return report;
}

function getEngagementMetrics(timeframe = 30) { // days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);

  const { progressData } = require('./progress');

  const metrics = {
    timeframe,
    totalUsers: progressData.length,
    activeUsers: 0,
    newUsers: 0,
    returningUsers: 0,
    averageSessionTime: 0,
    topScenarios: {}
  };

  let totalSessionTime = 0;
  const scenarioCompletions = {};

  progressData.forEach(progress => {
    const lastActivity = new Date(progress.lastActivity);

    if (lastActivity >= cutoffDate) {
      metrics.activeUsers++;
    }

    // Calculate session times from progress data
    Object.values(progress.progress).forEach(scenario => {
      totalSessionTime += scenario.timeSpent || 0;

      if (scenario.status === 'completed') {
        scenarioCompletions[scenario.scenarioId] = (scenarioCompletions[scenario.scenarioId] || 0) + 1;
      }
    });
  });

  metrics.averageSessionTime = metrics.activeUsers > 0
    ? Math.round(totalSessionTime / metrics.activeUsers)
    : 0;

  // Get top scenarios
  const sortedScenarios = Object.entries(scenarioCompletions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  metrics.topScenarios = Object.fromEntries(sortedScenarios);

  return metrics;
}

module.exports = {
  generateInstitutionReport,
  generateUserReport,
  generateComplianceReport,
  getEngagementMetrics
};