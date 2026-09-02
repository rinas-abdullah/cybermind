// API utilities — same-origin /api + auth headers (works as ES module and sets window.API)

function mergeAuthHeaders(base = {}) {
  const headers = { ...base };
  if (
    typeof window !== "undefined" &&
    window.authService &&
    typeof window.authService.getAuthHeader === "function"
  ) {
    Object.assign(headers, window.authService.getAuthHeader());
  }
  return headers;
}

async function apiRequest(method, path, body) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `/api${normalized}`;
  const headers = mergeAuthHeaders({});
  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }
  const opts = {
    method,
    headers,
  };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const response = await fetch(url, opts);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export const API = {
  get(path) {
    return apiRequest("GET", path);
  },
  post(path, body) {
    return apiRequest("POST", path, body);
  },
};

export async function updateScore(username, amount) {
  return API.post("/update-score", { username, amount });
}

export async function getLeaderboard() {
  return API.get("/leaderboard");
}

export async function getUserData(username) {
  return API.get(`/user/${username}`);
}

export async function getUserProgress(username) {
  return API.get(`/progress/${username}`);
}

export async function updateProgress(progressData) {
  return API.post("/progress", progressData);
}

export async function healthCheck() {
  return API.get("/health");
}

if (typeof window !== "undefined") {
  window.API = API;
}
