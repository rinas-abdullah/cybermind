import { loadScenario } from "./components/scenario.js";
import { showLeaderboard } from "./components/leaderboard.js";
import { openTerminal } from "./components/terminal.js";
import { renderScoreChart } from "./components/scoreChart.js";

/* ==================================================
   SIMPLE API HELPER
================================================== */
const api = {
  async get(url) {
    const response = await fetch(`/api${url}`);
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
   USER STATE
================================================== */
function getCurrentUser() {
  return localStorage.getItem("cybermind_user") || "Guest";
}

function getCurrentScore() {
  return Number(localStorage.getItem("cybermind_score")) || 0;
}

function setCurrentUser(user, score = 0) {
  localStorage.setItem("cybermind_user", user);
  localStorage.setItem("cybermind_score", String(score));
}

/* ==================================================
   DASHBOARD
================================================== */
const userLabel = document.getElementById("userLabel");
const userScore = document.getElementById("userScore");
const userRank = document.getElementById("userRank");
const userScenarios = document.getElementById("userScenarios");

if (userLabel && userScore) {
  initializeDashboard();
}

async function initializeDashboard() {
  const user = getCurrentUser();
  const score = getCurrentScore();

  userLabel.textContent = user;
  userScore.textContent = String(score);

  // Admin link visibility
  const adminLink = document.getElementById("admin-link");
  if (adminLink) {
    if (user.toLowerCase() === "admin") {
      adminLink.style.display = "inline";
    } else {
      adminLink.style.display = "none";
    }
  }

  // Default rank
  if (userRank) {
    userRank.textContent = "-";
  }

  // Update completed scenarios count
  if (userScenarios) {
    await updateUserScenariosCount();
  }

  // Render chart safely
  try {
    renderScoreChart();
  } catch (error) {
    console.error("Score chart rendering failed:", error);
  }

  // Try to fetch rank from leaderboard if user is not Guest
  if (user !== "Guest" && userRank) {
    try {
      const response = await api.get("/leaderboard");
      const board = response.data || response;

      const currentUserEntry = board.find(
        (entry) => entry.username.toLowerCase() === user.toLowerCase()
      );

      userRank.textContent = currentUserEntry ? `#${currentUserEntry.rank}` : "-";
    } catch (error) {
      console.error("Failed to fetch leaderboard rank:", error);
      userRank.textContent = "-";
    }
  }
}

// Update scenarios count on dashboard
async function updateUserScenariosCount() {
  const user = getCurrentUser();
  const userScenariosElement = document.getElementById("userScenarios");

  if (!userScenariosElement) return;

  // Guest user
  if (user === "Guest") {
    userScenariosElement.textContent = "0";
    return;
  }

  // Try localStorage first
  const progressKey = `cybermind_progress_${user}`;
  let localProgress = null;

  try {
    localProgress = JSON.parse(localStorage.getItem(progressKey));
  } catch (error) {
    localProgress = null;
  }

  if (localProgress?.completedScenarios) {
    userScenariosElement.textContent = String(
      localProgress.completedScenarios.length
    );
    return;
  }

  // Fallback to backend
  try {
    const response = await api.get(`/progress/${encodeURIComponent(user)}`);
    const progressData = response.data || response;

    if (progressData?.completedScenarios) {
      userScenariosElement.textContent = String(
        progressData.completedScenarios.length
      );

      // Cache locally
      localStorage.setItem(progressKey, JSON.stringify(progressData));
    } else {
      userScenariosElement.textContent = "0";
    }
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    userScenariosElement.textContent = "0";
  }
}

// Make available globally for components if needed
window.updateUserScenariosCount = updateUserScenariosCount;

/* ==================================================
   TRAINING PAGE
================================================== */
const startScenarioBtn = document.getElementById("startScenario");

if (startScenarioBtn) {
  startScenarioBtn.addEventListener("click", () => {
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
  try {
    showLeaderboard();
  } catch (error) {
    console.error("Failed to show leaderboard:", error);
  }
}

/* ==================================================
   TERMINAL PAGE
================================================== */
const terminalContainer = document.getElementById("terminalContainer");

if (terminalContainer) {
  try {
    openTerminal();
  } catch (error) {
    console.error("Failed to open terminal:", error);
  }
}