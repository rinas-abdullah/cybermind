// Score Service - Future database integration
// TODO: Implement when adding MongoDB/MySQL
//
// This service will handle:
// - Score updates
// - Point calculations
// - Level progression
// - Score history tracking

class ScoreService {
  // TODO: Replace in-memory score updates with database operations
  async updateUserScore(username, pointsToAdd) {
    // Future implementation:
    // 1. Find user by username in database
    // 2. Update points (use atomic operations to prevent race conditions)
    // 3. Recalculate level based on new points
    // 4. Update level in database
    // 5. Log score change in training_progress table
    // 6. Return updated user data

    throw new Error('Not implemented - awaiting database integration');
  }

  // TODO: Implement score history retrieval
  async getUserScoreHistory(username) {
    // Future implementation:
    // 1. Query training_progress table for user's score changes
    // 2. Return chronological score history
    // 3. Include challenge details and timestamps

    throw new Error('Not implemented - awaiting database integration');
  }

  // TODO: Implement level calculation
  calculateLevel(points) {
    if (points >= 1700) return 5; // LEGEND
    if (points >= 1300) return 4; // VISIONARY
    if (points >= 900) return 3; // VOYAGER
    if (points >= 600) return 2; // ADEPT
    if (points >= 300) return 1; // APPRENTICE
    return 0; // NEWBIE
  }
}

module.exports = new ScoreService();