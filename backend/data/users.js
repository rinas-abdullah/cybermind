// Demo database - In-memory user storage
// NOTE: This is for development/demo only.
// Passwords are stored in plain text temporarily.
// In production, replace with a real database and hashed passwords.
//
// Future schema suggestion:
// Users:
// - id
// - username
// - password_hash
// - points
// - level
// - role
// - created_at

const users = [
  {
    id: 1,
    username: "admin",
    password: "admin",
    points: 1200,
    level: 3,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "guest",
    password: "guest",
    points: 300,
    level: 1,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: "CyberFox",
    password: "demo",
    points: 1850,
    level: 4,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    username: "NetRunner",
    password: "demo",
    points: 1620,
    level: 4,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    username: "PacketNinja",
    password: "demo",
    points: 1430,
    level: 3,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    username: "ShadowRoot",
    password: "demo",
    points: 980,
    level: 2,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    username: "BlueShield",
    password: "demo",
    points: 860,
    level: 2,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    username: "RedSpectre",
    password: "demo",
    points: 720,
    level: 2,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 9,
    username: "CryptoCat",
    password: "demo",
    points: 640,
    level: 2,
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: 10,
    username: "LogWatcher",
    password: "demo",
    points: 510,
    level: 1,
    role: "student",
    createdAt: new Date().toISOString(),
  },
];

module.exports = users;