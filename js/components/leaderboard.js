// js/components/leaderboard.js

import { getLeaderboard } from "../utils/api.js";

export function showLeaderboard() {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  function animateEntry(el) {
    if (!el) return;
    el.classList.add("fade-slide-up");
    setTimeout(() => el.classList.remove("fade-slide-up"), 900);
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px 0;">
      <div class="skeleton" style="height: 52px; border-radius: 12px;"></div>
      <div class="skeleton" style="height: 52px; border-radius: 12px;"></div>
      <div class="skeleton" style="height: 52px; border-radius: 12px;"></div>
    </div>
  `;

  getLeaderboard()
    .then((response) => {
      const rawData = response?.data || response;
      const data = Array.isArray(rawData) ? rawData : [];

      if (!data.length) {
        container.innerHTML = `
          <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:0.9rem;">
            No leaderboard data yet.
          </div>
        `;
        return;
      }

      const normalized = data.map((user, index) => ({
        username: user.username || "Unknown",
        points: Number(user.points ?? user.score ?? 0),
        rank: Number(user.rank ?? index + 1),
        level: Number(user.level ?? 1),
      }));

      updateUserRank(normalized);

      const top3 = normalized.slice(0, 3);
      const rest = normalized.slice(3);

      const topHtml = `
        <div class="lb-top">
          ${top3.map((user) => renderTopCard(user)).join("")}
        </div>
      `;

      const listHtml = `
        <div class="lb-list-card">
          ${rest.map((user) => renderRow(user)).join("")}
        </div>
      `;

      container.innerHTML = topHtml + listHtml;

      setTimeout(() => {
        container.querySelectorAll(".lb-top-card, .lb-row").forEach(animateEntry);
      }, 40);
    })
    .catch((err) => {
      console.error("Leaderboard error:", err);
      container.innerHTML = `
        <div style="padding:24px;text-align:center;color:var(--accent-red);font-size:0.9rem;">
          Could not load leaderboard. Check backend.
        </div>
      `;
    });
}

function updateUserRank(leaderboardData) {
  const currentUser = localStorage.getItem("username");
  const userRankElement = document.getElementById("userRank");

  if (!currentUser || !userRankElement) return;

  const userIndex = leaderboardData.findIndex(
    (user) => user.username.toLowerCase() === currentUser.toLowerCase()
  );

  userRankElement.textContent = userIndex !== -1 ? `#${userIndex + 1}` : "—";
}

function renderTopCard(user) {
  const initials = getInitials(user.username);
  const tier = getTier(user.points);
  const hexTag = getHexTag(user.rank);

  return `
    <div class="lb-top-card">
      <div class="lb-top-header">
        <div class="lb-avatar-large">${initials}</div>

        <div class="lb-top-meta">
          <div class="lb-username">${escapeHtml(user.username)}</div>
          <div class="lb-tag">${hexTag} ${tier}</div>
          <div class="lb-streak">🔥 Top Agent</div>
        </div>

        <div class="lb-rank-number">${user.rank}</div>
      </div>

      <div class="lb-top-footer">
        <span class="lb-points-label">Points</span>
        <span class="lb-points-big">${user.points}</span>
      </div>
    </div>
  `;
}

function renderRow(user) {
  const initials = getInitials(user.username);
  const tier = getTier(user.points);
  const hexTag = getHexTag(user.rank);

  return `
    <div class="lb-row">
      <div class="lb-row-left">
        <span class="lb-row-rank">${user.rank}</span>

        <div class="lb-avatar-small">${initials}</div>

        <div class="lb-row-text">
          <div class="lb-username">${escapeHtml(user.username)}</div>
          <div class="lb-tag-small">${hexTag} ${tier}</div>
          <div class="lb-streak-small">⚡ Active</div>
        </div>
      </div>

      <div class="lb-row-points">${user.points} Points</div>
    </div>
  `;
}

function getInitials(name) {
  if (!name) return "?";
  return String(name).trim().charAt(0).toUpperCase();
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
  const value = Math.max(1, 6 - Number(rank || 1));
  return `0x${value.toString(16).toUpperCase()}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}