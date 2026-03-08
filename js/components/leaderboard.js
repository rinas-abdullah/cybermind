// src/components/leaderboard.js

import { getLeaderboard } from "../utils/api.js";

export function showLeaderboard() {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  // Show loading state
  container.innerHTML = "<p>Loading leaderboard...</p>";

  getLeaderboard()
    .then((response) => {
      const data = response.data || response; // Handle different response formats

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p>No leaderboard data yet.</p>";
        return;
      }

      // Update user's rank on dashboard
      updateUserRank(data);

      const top3 = data.slice(0, 3);
      const rest = data.slice(3);

      const topHtml = `
        <div class="lb-top">
          ${top3
            .map((user, index) => renderTopCard(user, index + 1))
            .join("")}
        </div>
      `;

      const listHtml = `
        <div class="lb-list-card">
          ${rest
            .map((user, idx) => renderRow(user, idx + 4)) // rank starts at 4
            .join("")}
        </div>
      `;

      container.innerHTML = topHtml + listHtml;
    })
    .catch((err) => {
      console.error("Leaderboard error:", err);
      container.innerHTML =
        "<p>Could not load leaderboard. Check backend.</p>";
    });
}

function updateUserRank(leaderboardData) {
  const currentUser = localStorage.getItem("cybermind_user");
  const userRankElement = document.getElementById("userRank");

  if (!currentUser || !userRankElement) return;

  const userIndex = leaderboardData.findIndex(user =>
    user.username.toLowerCase() === currentUser.toLowerCase()
  );

  if (userIndex !== -1) {
    userRankElement.textContent = `#${userIndex + 1}`;
  } else {
    userRankElement.textContent = "-";
  }
}

function renderTopCard(user, rank) {
  const initials = getInitials(user.username);
  const tier = getTier(user.points);
  const hexTag = getHexTag(rank);

  return `
    <div class="lb-top-card">
      <div class="lb-top-header">
        <div class="lb-avatar-large">${initials}</div>
        <div class="lb-top-meta">
          <div class="lb-username">${user.username}</div>
          <div class="lb-tag">${hexTag}[${tier}]</div>
          <div class="lb-streak">🔥 3+ Day Streak</div>
        </div>
        <div class="lb-rank-number">${rank}</div>
      </div>
      <div class="lb-top-footer">
        <span class="lb-points-label">Points</span>
        <span class="lb-points-big">${user.points}</span>
      </div>
    </div>
  `;
}

function renderRow(user, rank) {
  const initials = getInitials(user.username);
  const tier = getTier(user.points);
  const hexTag = getHexTag(rank);

  return `
    <div class="lb-row">
      <div class="lb-row-left">
        <span class="lb-row-rank">${rank}</span>
        <div class="lb-avatar-small">${initials}</div>
        <div class="lb-row-text">
          <div class="lb-username">${user.username}</div>
          <div class="lb-tag-small">${hexTag}[${tier}]</div>
          <div class="lb-streak-small">🔥 3+ Day Streak</div>
        </div>
      </div>
      <div class="lb-row-points">${user.points} Points</div>
    </div>
  `;
}

function getInitials(name) {
  if (!name) return "?";
  return name[0].toUpperCase();
}

function getTier(points) {
  if (points >= 1700) return "LEGEND";
  if (points >= 1300) return "VISIONARY";
  if (points >= 900) return "VOYAGER";
  if (points >= 600) return "ADEPT";
  if (points >= 300) return "APPRENTICE";
  return "NEWBIE";
}

function getHexTag(rank) {
  // just for the vibe: [0x5], [0x4], ...
  const base = 5 - rank;
  const n = base > 0 ? base : 1;
  return `[0x${n.toString(16).toUpperCase()}]`;
}
