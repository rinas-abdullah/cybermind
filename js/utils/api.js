// API Utilities - Centralized API calls for the frontend
// This makes it easy to change API endpoints and add error handling

const API_BASE = 'http://localhost:3001/api';

/**
 * Generic API call wrapper with error handling
 */
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Update user score
 */
export async function updateScore(username, amount) {
  return apiCall('/update-score', {
    method: 'POST',
    body: JSON.stringify({ username, amount })
  });
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard() {
  return apiCall('/leaderboard');
}

/**
 * Get user data
 */
export async function getUserData(username) {
  return apiCall(`/user/${username}`);
}

/**
 * Get user progress
 */
export async function getUserProgress(username) {
  return apiCall(`/progress/${username}`);
}

/**
 * Update user progress
 */
export async function updateProgress(progressData) {
  return apiCall('/progress', {
    method: 'POST',
    body: JSON.stringify(progressData)
  });
}

/**
 * Health check
 */
export async function healthCheck() {
  return apiCall('/health');
}