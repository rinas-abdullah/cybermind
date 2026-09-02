const db = require("../../db");

class LearnerProfileService {
  constructor() {
    this.inMemoryProfiles = new Map();
  }

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  safeString(value, fallback = "") {
    if (value === undefined || value === null) return fallback;
    const normalized = String(value).trim();
    return normalized || fallback;
  }

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  now() {
    return new Date().toISOString();
  }

  createDefaultLearnerProfile(userId, username) {
    return {
      userId: this.safeString(userId, ""),
      username: this.safeString(username, "unknown-user"),
      knowledgeLevel: 0,
      riskPersona: "Unclassified",
      completedScenarios: 0,
      totalScore: 0,
      level: 1,
      skillLevel: "beginner",
      weakSkills: [],
      strongSkills: [],
      streak: 0,
      interests: [],
      behaviors: {
        decisionVelocity: 0,
        warningAcknowledgment: 50,
        verificationBehavior: 50,
        pressurePerformance: 50,
        consistencyScore: 50,
      },
      lastScenarioType: "",
      lastRiskLevel: "",
      averageRiskScore: 0,
      averageDecisionVelocity: 0,
      warningAcknowledgmentAverage: 50,
      verificationBehaviorAverage: 50,
      pressurePerformanceAverage: 50,
      consistencyScoreAverage: 50,
      repeatedMistakePatterns: [],
      recommendedFocusAreas: [],
      lastUpdatedAt: this.now(),
    };
  }

  async saveProfileToDB(profile) {
    if (!db || typeof db.query !== "function") return false;

    try {
      await db.query(
        `
          INSERT INTO learner_profiles (user_id, profile_data, updated_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id)
          DO UPDATE SET
            profile_data = EXCLUDED.profile_data,
            updated_at = EXCLUDED.updated_at
        `,
        [profile.userId, JSON.stringify(profile), profile.lastUpdatedAt]
      );
      return true;
    } catch (error) {
      console.warn("Failed to save learner profile to DB:", error.message);
      return false;
    }
  }

  async loadProfileFromDB(userId) {
    if (!db || typeof db.query !== "function") return null;

    try {
      const result = await db.query(
        `SELECT profile_data FROM learner_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (result.rows.length > 0) {
        const raw = result.rows[0].profile_data;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch (error) {
      console.warn("Failed to load learner profile from DB:", error.message);
    }

    return null;
  }

  async getLearnerProfile(userId) {
    const safeUserId = this.safeString(userId, "");
    if (!safeUserId) return null;

    let profile = await this.loadProfileFromDB(safeUserId);
    if (profile) return profile;

    profile = this.inMemoryProfiles.get(safeUserId);
    if (profile) return profile;

    profile = this.createDefaultLearnerProfile(safeUserId, "");
    this.inMemoryProfiles.set(safeUserId, profile);
    return profile;
  }

  async updateLearnerProfile(userId, updatedProfile) {
    const safeUserId = this.safeString(userId, "");
    if (!safeUserId) return null;

    updatedProfile.userId = safeUserId;
    updatedProfile.lastUpdatedAt = this.now();

    this.inMemoryProfiles.set(safeUserId, updatedProfile);
    await this.saveProfileToDB(updatedProfile);

    return updatedProfile;
  }

  mergeBehaviorMetrics(existingProfile, behaviorAnalysis) {
    const behaviors = this.safeObject(existingProfile.behaviors);
    const newBehaviors = this.safeObject(behaviorAnalysis);
    const count = this.safeNumber(existingProfile.completedScenarios, 0) + 1;

    behaviors.decisionVelocity = Math.round(
      (this.safeNumber(behaviors.decisionVelocity, 0) * (count - 1) +
        this.safeNumber(newBehaviors.decisionVelocity, 0)) /
        count
    );
    behaviors.warningAcknowledgment = Math.round(
      (this.safeNumber(behaviors.warningAcknowledgment, 50) * (count - 1) +
        this.safeNumber(newBehaviors.warningAcknowledgment, 50)) /
        count
    );
    behaviors.verificationBehavior = Math.round(
      (this.safeNumber(behaviors.verificationBehavior, 50) * (count - 1) +
        this.safeNumber(newBehaviors.verificationBehavior, 50)) /
        count
    );
    behaviors.pressurePerformance = Math.round(
      (this.safeNumber(behaviors.pressurePerformance, 50) * (count - 1) +
        this.safeNumber(newBehaviors.pressurePerformance, 50)) /
        count
    );
    behaviors.consistencyScore = Math.round(
      (this.safeNumber(behaviors.consistencyScore, 50) * (count - 1) +
        this.safeNumber(newBehaviors.consistencyScore, 50)) /
        count
    );

    return behaviors;
  }

  deriveRiskPersona(profile) {
    const avgRisk = this.safeNumber(profile.averageRiskScore, 0);
    const warningAvg = this.safeNumber(profile.behaviors.warningAcknowledgment, 50);
    const verificationAvg = this.safeNumber(profile.behaviors.verificationBehavior, 50);
    const consistency = this.safeNumber(profile.behaviors.consistencyScore, 50);

    if (avgRisk > 70) return "High-Risk Responder";
    if (warningAvg > 80 && verificationAvg > 80 && consistency > 80) return "Careful Defender";
    if (warningAvg < 40 || verificationAvg < 40) return "Risk-Tolerant Learner";
    if (consistency > 70) return "Consistent Performer";
    return "Balanced Learner";
  }

  deriveRecommendedFocusAreas(profile) {
    const areas = [];
    const behaviors = this.safeObject(profile.behaviors);

    if (this.safeNumber(behaviors.warningAcknowledgment, 50) < 60) {
      areas.push("threat awareness");
    }
    if (this.safeNumber(behaviors.verificationBehavior, 50) < 60) {
      areas.push("verification practices");
    }

    const decisionVelocity = this.safeNumber(behaviors.decisionVelocity, 0);
    if (decisionVelocity < 3000 || decisionVelocity > 15000) {
      areas.push("decision pacing");
    }

    if (this.safeNumber(behaviors.pressurePerformance, 50) < 60) {
      areas.push("stress management");
    }
    if (this.safeNumber(behaviors.consistencyScore, 50) < 60) {
      areas.push("consistency building");
    }

    return [...new Set(areas)];
  }

  calculateProfileLevel(profile) {
    const completed = this.safeNumber(profile.completedScenarios, 0);
    const totalScore = this.safeNumber(profile.totalScore, 0);
    const knowledge = this.safeNumber(profile.knowledgeLevel, 0);

    const baseLevel =
      Math.floor(totalScore / 200) +
      Math.floor(completed / 5) +
      Math.floor(knowledge / 20);

    return Math.max(1, Math.min(10, baseLevel));
  }

  calculateSkillLevel(profile) {
    const level = this.safeNumber(profile.level, 1);
    const knowledge = this.safeNumber(profile.knowledgeLevel, 0);

    if (knowledge > 60 && level > 4) return "advanced";
    if (knowledge > 40 && level > 2) return "intermediate";
    return "beginner";
  }

  updateWeakAndStrongSkills(profile, analysisResult) {
    const weakSkills = this.safeArray(profile.weakSkills);
    const strongSkills = this.safeArray(profile.strongSkills);
    const riskLevel = this.safeString(analysisResult.riskScore?.riskLevel, "");
    const behaviors = this.safeObject(profile.behaviors);

    if (riskLevel === "high" || riskLevel === "critical" || riskLevel === "very-high") {
      if (!weakSkills.includes("risk assessment")) weakSkills.push("risk assessment");
    }

    if (this.safeNumber(behaviors.warningAcknowledgment, 50) < 60) {
      if (!weakSkills.includes("phishing")) weakSkills.push("phishing");
    }

    if (this.safeNumber(behaviors.verificationBehavior, 50) < 60) {
      if (!weakSkills.includes("verification")) weakSkills.push("verification");
    }

    if (this.safeNumber(behaviors.warningAcknowledgment, 50) > 80) {
      if (!strongSkills.includes("warning awareness")) {
        strongSkills.push("warning awareness");
      }
    }

    if (this.safeNumber(behaviors.verificationBehavior, 50) > 80) {
      if (!strongSkills.includes("verification")) {
        strongSkills.push("verification");
      }
    }

    profile.weakSkills = [...new Set(weakSkills)].slice(0, 5);
    profile.strongSkills = [...new Set(strongSkills)].slice(0, 5);
  }

  updateRepeatedMistakePatterns(profile, userAction, repeatedMistakes) {
    const patterns = this.safeArray(profile.repeatedMistakePatterns);
    const mistakes = this.safeNumber(repeatedMistakes, 0);

    if (mistakes > 2) {
      const pattern = `Repeated mistakes in ${this.safeString(userAction, "unknown action")}`;
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
      }
    }

    profile.repeatedMistakePatterns = [...new Set(patterns)].slice(0, 5);
  }

  async updateLearnerProfileFromAnalysis(userId, analysisResult) {
    try {
      const profile = await this.getLearnerProfile(userId);
      if (!profile) return null;

      const riskScore = this.safeNumber(analysisResult.riskScore?.riskScore, 0);

      profile.completedScenarios = this.safeNumber(profile.completedScenarios, 0) + 1;
      profile.totalScore = this.safeNumber(profile.totalScore, 0) + riskScore;
      profile.knowledgeLevel = Math.round(profile.totalScore / profile.completedScenarios);

      profile.behaviors = this.mergeBehaviorMetrics(profile, analysisResult.behaviorAnalysis);

      profile.averageRiskScore = Math.round(profile.totalScore / profile.completedScenarios);
      profile.averageDecisionVelocity = profile.behaviors.decisionVelocity;
      profile.warningAcknowledgmentAverage = profile.behaviors.warningAcknowledgment;
      profile.verificationBehaviorAverage = profile.behaviors.verificationBehavior;
      profile.pressurePerformanceAverage = profile.behaviors.pressurePerformance;
      profile.consistencyScoreAverage = profile.behaviors.consistencyScore;

      profile.lastScenarioType = this.safeString(analysisResult.scenarioType, "");
      profile.lastRiskLevel = this.safeString(analysisResult.riskScore?.riskLevel, "");

      this.updateWeakAndStrongSkills(profile, analysisResult);
      this.updateRepeatedMistakePatterns(
        profile,
        analysisResult.userAction,
        analysisResult.repeatedMistakes
      );

      profile.riskPersona = this.deriveRiskPersona(profile);
      profile.recommendedFocusAreas = this.deriveRecommendedFocusAreas(profile);
      profile.level = this.calculateProfileLevel(profile);
      profile.skillLevel = this.calculateSkillLevel(profile);

      if (profile.lastRiskLevel === "low" || profile.lastRiskLevel === "very-low") {
        profile.streak = this.safeNumber(profile.streak, 0) + 1;
      } else {
        profile.streak = 0;
      }

      return await this.updateLearnerProfile(userId, profile);
    } catch (error) {
      console.warn("Failed to update learner profile from analysis:", error.message);
      return null;
    }
  }
}

module.exports = LearnerProfileService;