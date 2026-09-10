import { loadScenario } from "./components/scenario.js";
import { showLeaderboard } from "./components/leaderboard.js";
import { openTerminal } from "./components/terminal.js";
import { renderScoreChart } from "./components/scoreChart.js";

/* ==================================================
   SIMPLE API HELPER
================================================== */
const api = {
  getAuthHeaders() {
    const headers = {};
    if (typeof window !== "undefined" && window.authService && authService.isAuthenticated && typeof authService.isAuthenticated === "function") {
      if (authService.isAuthenticated()) {
        Object.assign(headers, authService.getAuthHeader && typeof authService.getAuthHeader === "function" ? authService.getAuthHeader() : {});
      }
    }
    return headers;
  },

  async get(url) {
    const response = await fetch(`/api${url}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`GET ${url} failed with status ${response.status}`);
    }

    return response.json();
  },

  async post(url, body = {}) {
    const response = await fetch(`/api${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`POST ${url} failed with status ${response.status}`);
    }

    return response.json();
  },
};

/* ==================================================
   USER STATE & AUTH INTEGRATION
================================================== */
async function ensureAuthenticated() {
  if (!window.authService || !authService.isAuthenticated()) {
    window.location.href = "/auth";
    return false;
  }

  const valid = await authService.verifyToken();
  if (!valid) {
    authService.clearAuthData();
    window.location.href = "/auth";
    return false;
  }

  return true;
}

function getCurrentUser() {
  if (typeof window === "undefined" || !window.authService) return "Guest";
  return authService.username || "Guest";
}

async function getCurrentProfile() {
  if (typeof window === "undefined" || !window.authService) return null;
  try {
    if (typeof authService.getProfile === "function") {
      return await authService.getProfile();
    }
  } catch (error) {
    console.warn("Failed to get profile:", error);
  }
  return null;
}

/* ==================================================
   DASHBOARD
================================================== */
const userLabel = document.getElementById("userLabel");
const userScore = document.getElementById("userScore");
const userRank = document.getElementById("userRank");
const userScenarios = document.getElementById("userScenarios");

if (userLabel && userScore) {
  ensureAuthenticated().then((valid) => {
    if (valid) initializeDashboard();
  });
}

async function initializeDashboard() {
  const user = getCurrentUser();
  const profile = await getCurrentProfile();

  const score = Number(profile?.profile?.totalScore ?? profile?.totalScore ?? 0);
  const completedScenarios = Number(
    profile?.profile?.completedScenarios ?? profile?.completedScenarios ?? 0
  );

  if (userLabel) userLabel.textContent = user;
  if (userScore) userScore.textContent = String(score);
  if (userScenarios) {
    userScenarios.textContent = String(completedScenarios);
    renderSkillPaths(completedScenarios);
  }

  const adminLink = document.getElementById("admin-link");
  if (adminLink) {
    adminLink.style.display =
      authService.isAdmin && authService.isAdmin() ? "inline" : "none";
  }

  if (userRank) {
    userRank.textContent = "—";
  }

  if (userScenarios) {
    await updateUserScenariosCount();
  }

  try {
    renderScoreChart();
  } catch (error) {
    console.error("Score chart rendering failed:", error);
  }

  if (user !== "Guest" && userRank) {
    try {
      const response = await api.get("/leaderboard");
      const board = response.data || response;

      if (Array.isArray(board)) {
        const currentUserEntry = board.find(
          (entry) =>
            String(entry.username || "").toLowerCase() === user.toLowerCase()
        );

        userRank.textContent = currentUserEntry
          ? `#${currentUserEntry.rank ?? board.indexOf(currentUserEntry) + 1}`
          : "—";
      } else {
        userRank.textContent = "—";
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard rank:", error);
      userRank.textContent = "—";
    }
  }

  if (window.navBar && typeof window.navBar.updateUserStats === "function") {
    window.navBar.updateUserStats();
  }
}

/* ==================================================
   OPTIONAL AI DASHBOARD ENHANCEMENTS
================================================== */
async function loadAIDashboardData(username) {
  try {
    const response = await api.get(`/ai/dashboard/${encodeURIComponent(username)}`);
    const dashboardData = response.data || response;

    if (dashboardData) {
      updateDashboardWithAIData(dashboardData);
    }
  } catch (error) {
    console.error("Failed to load AI dashboard data:", error);
  }
}

function updateDashboardWithAIData(data) {
  const userLevelEl = document.getElementById("userLevel");
  if (userLevelEl && data.profile?.knowledgeLevel) {
    userLevelEl.textContent = `L${Math.floor(data.profile.knowledgeLevel / 10) + 1}`;
  }

  const recommendationBox = document.querySelector(".recommendation-box");
  if (recommendationBox && data.recommendations?.nextScenario) {
    const skill = data.recommendations.focusAreas?.[0] || "general security";
    recommendationBox.innerHTML = `
      <div class="recommendation-icon">🤖</div>
      <div>
        <h4>AI Recommendation: ${escapeHtml(data.recommendations.nextScenario)}</h4>
        <p>Based on your ${escapeHtml(
          data.profile?.riskPersona || "learning profile"
        )}, focus on ${escapeHtml(skill)} to advance your skills.</p>
      </div>
    `;
  }

  const progressFill = document.querySelector(".progress-fill");
  if (progressFill && data.profile?.knowledgeLevel) {
    progressFill.style.width = `${data.profile.knowledgeLevel}%`;

    const progressTop = progressFill.parentElement?.previousElementSibling;
    const progressText = progressTop?.querySelector("span:last-child");
    if (progressText) {
      progressText.textContent = `${data.profile.knowledgeLevel}%`;
    }
  }

  addAIInsightsCard(data);
}

function addAIInsightsCard(data) {
  const operationsCenter = document.querySelector(".dashboard-main-col");
  if (!operationsCenter) return;
  if (document.getElementById("ai-insights-card")) return;

  const insightsCard = document.createElement("div");
  insightsCard.id = "ai-insights-card";
  insightsCard.className = "dashboard-card-v2";

  insightsCard.innerHTML = `
    <div class="card-header-v2">
      <div>
        <p class="card-kicker">AI Analysis</p>
        <h3>Learning Profile</h3>
      </div>
      <span class="card-tag badge-purple" style="background:rgba(147,51,234,0.08);color:#9333ea;border:1px solid rgba(147,51,234,0.15);">Intelligent</span>
    </div>

    <div class="ai-profile-grid">
      <div class="profile-item">
        <span class="profile-label">Knowledge Level</span>
        <span class="profile-value">${data.profile?.knowledgeLevel || 0}/100</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">Risk Persona</span>
        <span class="profile-value">${escapeHtml(data.profile?.riskPersona || "Analyzing...")}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">Scenarios Completed</span>
        <span class="profile-value">${data.profile?.completedScenarios || 0}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">Weakest Skill</span>
        <span class="profile-value">${escapeHtml(data.skillMemory?.[0]?.skillName || "Assessing...")}</span>
      </div>
    </div>

    ${
      data.recommendations?.focusAreas?.length
        ? `
      <div class="focus-areas">
        <h4>Focus Areas:</h4>
        <div class="focus-tags">
          ${data.recommendations.focusAreas
            .slice(0, 3)
            .map((skill) => `<span class="focus-tag">${escapeHtml(skill)}</span>`)
            .join("")}
        </div>
      </div>
    `
        : ""
    }
  `;

  const recommendationCard = operationsCenter.querySelector(
    ".dashboard-card-v2:nth-child(2)"
  );

  if (recommendationCard) {
    recommendationCard.insertAdjacentElement("afterend", insightsCard);
  } else {
    operationsCenter.appendChild(insightsCard);
  }
}

/* ==================================================
   USER PROGRESS
================================================== */
async function updateUserScenariosCount() {
  const user = getCurrentUser();
  const userScenariosElement = document.getElementById("userScenarios");

  if (!userScenariosElement) return;

  if (user === "Guest") {
    userScenariosElement.textContent = "0";
    return;
  }

  const progressKey = `cybermind_progress_${user}`;
  let localProgress = null;

  try {
    localProgress = JSON.parse(localStorage.getItem(progressKey));
  } catch {
    localProgress = null;
  }

  if (localProgress?.completedScenarios) {
    const count = localProgress.completedScenarios.length;
    userScenariosElement.textContent = String(count);
    renderSkillPaths(count);
    return;
  }

  try {
    const response = await api.get(`/progress/${encodeURIComponent(user)}`);
    const progressData = response.data || response;

    if (progressData?.completedScenarios) {
      const count = progressData.completedScenarios.length;
      userScenariosElement.textContent = String(count);
      localStorage.setItem(progressKey, JSON.stringify(progressData));
      renderSkillPaths(count);
    } else {
      userScenariosElement.textContent = "0";
      renderSkillPaths(0);
    }
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    userScenariosElement.textContent = "0";
    renderSkillPaths(0);
  }
}

window.updateUserScenariosCount = updateUserScenariosCount;

/* ==================================================
   TRAINING PAGE
================================================== */
const startScenarioBtn = document.getElementById("startScenario");

if (startScenarioBtn) {
  startScenarioBtn.addEventListener("click", async () => {
    const valid = await ensureAuthenticated();
    if (!valid) return;

    try {
      loadScenario();
    } catch (error) {
      console.error("Failed to load scenario:", error);
    }
  });
}

/* ==================================================
   LEADERBOARD PAGE
================================================== */
const leaderboardContainer = document.getElementById("leaderboardContainer");

if (leaderboardContainer) {
  ensureAuthenticated().then((valid) => {
    if (!valid) return;

    try {
      showLeaderboard();
    } catch (error) {
      console.error("Failed to show leaderboard:", error);
    }
  });
}

/* ==================================================
   TERMINAL PAGE
================================================== */
const terminalContainer = document.getElementById("terminalContainer");

if (terminalContainer) {
  ensureAuthenticated().then((valid) => {
    if (!valid) return;

    try {
      openTerminal();
    } catch (error) {
      console.error("Failed to open terminal:", error);
    }
  });
}

/* ==================================================
   OPTIONAL AI DASHBOARD CALL
================================================== */
if (userLabel && userScore) {
  ensureAuthenticated().then(async (valid) => {
    if (!valid) return;

    const user = getCurrentUser();
    if (user !== "Guest") {
      await loadAIDashboardData(user);
    }
  });
}

/* ==================================================
   HELPERS
================================================== */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==================================================
   DYNAMIC ROOMS RENDERING
================================================== */

const skillPathsData = [
  {
    id: "web-fundamentals",
    title: "Web Fundamentals",
    description: "Introductory web security path, start with reconnaissance and XSS basics.",
    difficulty: "easy",
    category: "Web",
    duration: "45 min",
    learners: "8.4k",
    rating: "4.8",
    progress: 72,
    status: "continue",
    link: "/practice"
  },
  {
    id: "linux-evasion",
    title: "Linux Evasion",
    description: "Exploit privilege escalation in Linux, file permissions and kernel modules.",
    difficulty: "medium",
    category: "Linux",
    duration: "1h 20 min",
    learners: "4.1k",
    rating: "4.6",
    progress: 41,
    status: "continue",
    link: "/practice"
  },
  {
    id: "perimeter-defense",
    title: "Perimeter Defense",
    description: "Defend network perimeter from attackers, prepare IDS/IPS and firewall rules.",
    difficulty: "hard",
    category: "Network",
    duration: "2h",
    learners: "6.9k",
    rating: "4.7",
    progress: 15,
    status: "start",
    link: "/practice"
  }
];

function renderSkillPaths(completedCount = 0) {
  const roomsSection = document.querySelector('.rooms-section');
  const roomsGrid = document.querySelector('.rooms-grid');
  if (!roomsSection || !roomsGrid) return;

  const html = skillPathsData.map(path => `
    <article class="room-card">
      <div class="room-card-top">
        <span class="room-difficulty room-${path.difficulty}">${path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1)}</span>
        <span class="room-tag">${path.category}</span>
      </div>
      <h3>${escapeHtml(path.title)}</h3>
      <p>${escapeHtml(path.description)}</p>
      <div class="room-meta">
        <span>⏱️ ${path.duration}</span>
        <span>👥 ${path.learners} Learners</span>
        <span>⭐ ${path.rating}</span>
      </div>
      <div class="room-progress">
        <div class="room-progress-bar" style="width: ${path.progress}%;"></div>
      </div>
      <div class="room-footer">
        <span class="room-completion">${path.progress}% complete</span>
        <a href="${path.link}" class="btn btn-${path.status === 'start' ? 'ghost' : 'primary'} btn-sm">${path.status === 'start' ? 'Start' : 'Continue'}</a>
      </div>
    </article>
  `).join('');

  roomsGrid.innerHTML = html;

  // Render the premium Adaptive AI empty state banner if the user has 0 completions!
  const existingEmptyState = document.getElementById('empty-state-banner');
  if (completedCount === 0) {
    if (!existingEmptyState) {
      const banner = document.createElement('div');
      banner.id = 'empty-state-banner';
      banner.className = 'dashboard-empty-state';
      banner.style.marginBottom = '24px';
      
      const isArabic = document.documentElement.dir === 'rtl';
      
      banner.innerHTML = `
        <div class="empty-state-header">
          <div class="empty-state-icon">📡</div>
          <div>
            <h3 class="empty-state-title">${isArabic ? 'مرحباً بك في مركز العمليات السيبرانية' : 'Welcome to the Cyber Operations Center'}</h3>
            <p class="empty-state-subtitle">${isArabic ? 'ابدأ رحلتك التدريبية الآن لتطوير مهاراتك وحماية الأنظمة الرقمية.' : 'Initialize your tactical training path to strengthen digital defenses and advance your tier.'}</p>
          </div>
        </div>

        <div class="empty-state-ai-card">
          <div class="empty-state-ai-avatar">🤖</div>
          <div class="empty-state-ai-text">
            <h4>
              ${isArabic ? 'توصية المرشد الذكي لقسم التدريب' : 'AI Mentor Tactical Recommendation'}
              <span class="badge badge-teal" style="font-size: 0.65rem; margin-left: 8px;">${isArabic ? 'نشط' : 'Active'}</span>
            </h4>
            <p>${isArabic ? 'بناءً على تقييم ملفك، نوصي ببدء معمل "أساسيات الويب" (Web Fundamentals). هذا المسار يحتوي على ثغرات XSS وحقن SQL لتدريبك على المبادئ الأساسية للمخترق الأخلاقي والمدافع.' : 'Based on initial profiling, we highly recommend starting with the "Web Fundamentals" lab. This path features interactive SQLi and XSS scenarios tailored to build core offensive and defensive skills.'}</p>
          </div>
        </div>

        <div class="empty-state-actions">
          <a href="/practice" class="btn btn-primary">
            🚀 ${isArabic ? 'إطلاق المسار الأول مباشرة' : 'Launch First Scenario'}
          </a>
          <a href="/terminal" class="btn btn-secondary">
            💻 ${isArabic ? 'استكشاف المعمل الرقمي (Terminal)' : 'Explore Digital Terminal Lab'}
          </a>
        </div>
      `;

      roomsGrid.insertAdjacentElement('beforebegin', banner);
    }
  } else {
    if (existingEmptyState) {
      existingEmptyState.remove();
    }
  }
}

// Initialize rooms on dashboard load
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.rooms-grid')) {
    // Start with skeleton placeholders, real count will overwrite upon API resolution
    renderSkillPaths(1); 
  }
});