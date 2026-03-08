// Auth Service - Future database integration
// TODO: Implement when adding MongoDB/MySQL
//
// This service will handle:
// - User authentication
// - Password hashing/verification
// - JWT token generation (if needed)
// - Login/logout logic

class AuthService {
  // TODO: Replace in-memory user lookup with database query
  async authenticateUser(username, password) {
    // Future implementation:
    // 1. Query user by username from database
    // 2. Verify password hash using bcrypt
    // 3. Return user data if valid
    // 4. Handle authentication errors

    throw new Error('Not implemented - awaiting database integration');
  }

  // TODO: Implement user registration
  async registerUser(userData) {
    // Future implementation:
    // 1. Validate user data
    // 2. Hash password with bcrypt
    // 3. Insert user into database
    // 4. Return created user

    throw new Error('Not implemented - awaiting database integration');
  }
}

module.exports = new AuthService();