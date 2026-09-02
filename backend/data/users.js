// Demo users for leaderboard/testing only
// Do NOT use for authentication.

const DEMO_USERS = Object.freeze([
  Object.freeze({
    id: 1,
    username: "admin",
    points: 1200,
    level: 3,
    role: "admin",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 2,
    username: "guest",
    points: 300,
    level: 1,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 3,
    username: "CyberFox",
    points: 1850,
    level: 4,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 4,
    username: "NetRunner",
    points: 1620,
    level: 4,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 5,
    username: "PacketNinja",
    points: 1430,
    level: 3,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 6,
    username: "ShadowRoot",
    points: 980,
    level: 2,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 7,
    username: "BlueShield",
    points: 860,
    level: 2,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 8,
    username: "RedSpectre",
    points: 720,
    level: 2,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 9,
    username: "CryptoCat",
    points: 640,
    level: 2,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
  Object.freeze({
    id: 10,
    username: "LogWatcher",
    points: 510,
    level: 1,
    role: "learner",
    createdAt: new Date().toISOString(),
  }),
]);

function getAllDemoUsers() {
  return DEMO_USERS.map((user) => ({ ...user }));
}

function getDemoUserByUsername(username) {
  if (typeof username !== "string") return null;

  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return null;

  const user =
    DEMO_USERS.find(
      (item) => item.username.toLowerCase() === normalizedUsername
    ) || null;

  return user ? { ...user } : null;
}

function getLeaderboardDemoUsers() {
  return [...DEMO_USERS]
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
}

module.exports = {
  DEMO_USERS,
  getAllDemoUsers,
  getDemoUserByUsername,
  getLeaderboardDemoUsers,
};