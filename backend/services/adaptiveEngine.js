// ===== ADAPTIVE SCENARIO ENGINE =====

const { getAiClient } = require("./ai/aiProvider");

/**
 * Core algorithm that selects the next scenario based on:
 * - Learner's risk profile
 * - Skill gaps from memory
 * - Behavioral patterns
 * - Learning retention
 */
class AdaptiveScenarioEngine {
  constructor(userProfile = {}, skillMemory = [], scenarioDatabase = []) {
    this.userProfile = userProfile || {};
    this.skillMemory = Array.isArray(skillMemory) ? skillMemory : [];
    this.scenarioDatabase = Array.isArray(scenarioDatabase) ? scenarioDatabase : [];
    this.openaiClient = getAiClient();
  }

  /**
   * Select next scenario intelligently
   * @returns {Object|null} Selected scenario with metadata
   */
  async selectNextScenario(behavioralData = {}) {
    if (!Array.isArray(this.scenarioDatabase) || this.scenarioDatabase.length === 0) {
      return null;
    }

    // Step 1: Identify most critical skill gaps
    const skillGaps = this.identifySkillGaps();

    // Step 2: Get weakest skills that need reinforcement
    const weakestSkills = this.getWeakestSkills();

    // Merge both sources of weakness
    const prioritizedSkills = [...new Set([...skillGaps, ...weakestSkills])].slice(0, 5);

    // Step 3: Calculate appropriate difficulty
    const targetDifficulty = await this.calculateAppropriateDifficulty(behavioralData);

    // Step 4: Account for behavioral type
    const behavioralType = this.userProfile.riskPersona || "Unclassified";

    // Step 5: Filter scenarios matching criteria
    let candidateScenarios = this.scenarioDatabase.filter((scenario) => {
      return this.matchesCriteria(scenario, {
        skillTags: prioritizedSkills,
        difficulty: targetDifficulty,
        behavioralType,
      });
    });

    // Fallback 1: same skills, any nearby difficulty
    if (candidateScenarios.length === 0) {
      candidateScenarios = this.scenarioDatabase.filter((scenario) => {
        return this.matchesCriteria(scenario, {
          skillTags: prioritizedSkills,
          difficulty: targetDifficulty,
          behavioralType,
          allowNearbyDifficulty: true,
        });
      });
    }

    // Fallback 2: beginner scenarios for new users
    if (candidateScenarios.length === 0) {
      candidateScenarios = this.scenarioDatabase.filter(
        (scenario) => this.normalizeDifficulty(scenario.difficulty) === "beginner"
      );
    }

    // Fallback 3: any scenario
    if (candidateScenarios.length === 0) {
      candidateScenarios = this.scenarioDatabase;
    }

    // Step 6: Rank and select best match
    const selectedScenario = this.rankAndSelect(candidateScenarios, prioritizedSkills);

    if (!selectedScenario) {
      return null;
    }

    // Step 7: Enrich with adaptive metadata
    return await this.enrichScenarioWithContext(
      selectedScenario,
      prioritizedSkills,
      targetDifficulty,
      behavioralData
    );
  }

  /**
   * Identify which skills the user is struggling with
   */
  identifySkillGaps() {
    if (!Array.isArray(this.skillMemory) || this.skillMemory.length === 0) {
      return [];
    }

    const gaps = {};

    this.skillMemory.forEach((skill) => {
      if (!skill || typeof skill !== "object") return;

      const skillName = typeof skill.skillName === "string" ? skill.skillName.trim() : "";
      if (!skillName) return;

      const failureCount = Number(skill.failureCount) || 0;
      const successCount = Number(skill.successCount) || 0;
      const totalAttempts = failureCount + successCount;

      const failureRatio = totalAttempts > 0 ? failureCount / totalAttempts : 0;

      if (failureRatio > 0.3) {
        gaps[skillName] = {
          failureRatio,
          lastFailed: skill.lastFailed || null,
          priority: failureRatio * 100,
        };
      }
    });

    return Object.entries(gaps)
      .sort((a, b) => b[1].priority - a[1].priority)
      .slice(0, 3)
      .map(([skill]) => skill);
  }

  /**
   * Get skills that haven't been reinforced recently
   */
  getWeakestSkills() {
    if (!Array.isArray(this.skillMemory) || this.skillMemory.length === 0) {
      return [];
    }

    return this.skillMemory
      .filter((skill) => skill && typeof skill === "object")
      .filter((skill) => typeof skill.skillName === "string" && skill.skillName.trim())
      .filter((skill) => Number(skill.retentionConfidence ?? 100) < 70)
      .sort(
        (a, b) =>
          Number(a.retentionConfidence ?? 100) - Number(b.retentionConfidence ?? 100)
      )
      .slice(0, 3)
      .map((skill) => skill.skillName.trim());
  }

  /**
   * Normalize difficulty labels
   */
  normalizeDifficulty(difficulty) {
    const value = String(difficulty || "").trim().toLowerCase();

    if (["beginner", "easy", "basic", "1"].includes(value)) return "beginner";
    if (["intermediate", "medium", "2", "3"].includes(value)) return "intermediate";
    if (["advanced", "hard", "4"].includes(value)) return "advanced";
    if (["expert", "5"].includes(value)) return "expert";

    return "beginner";
  }

  /**
   * Get nearby difficulties for fallback matching
   */
  getDifficultyNeighbors(difficulty) {
    const normalized = this.normalizeDifficulty(difficulty);

    const map = {
      beginner: ["beginner", "intermediate"],
      intermediate: ["beginner", "intermediate", "advanced"],
      advanced: ["intermediate", "advanced", "expert"],
      expert: ["advanced", "expert"],
    };

    return map[normalized] || ["beginner"];
  }

  /**
   * Calculate appropriate difficulty based on performance
   */
  async calculateAppropriateDifficulty(behavioralData = {}) {
    const knowledgeLevel = Number(this.userProfile.knowledgeLevel) || 0;
    const successRate = Number(this.userProfile.successRate) || 0;

    let difficulty = "beginner";

    if (successRate > 90 || knowledgeLevel >= 85) {
      difficulty = "expert";
    } else if (successRate > 80 || knowledgeLevel >= 70) {
      difficulty = "advanced";
    } else if (successRate > 60 || knowledgeLevel >= 40) {
      difficulty = "intermediate";
    }

    if (
      behavioralData &&
      typeof behavioralData === "object" &&
      behavioralData.decisionTimeMs &&
      behavioralData.questionsAnswered
    ) {
      const avgTime =
        Number(behavioralData.decisionTimeMs) /
        Math.max(Number(behavioralData.questionsAnswered) || 1, 1);

      if (avgTime < 2000 && successRate < 60) {
        difficulty = "beginner";
      } else if (avgTime > 15000 && successRate > 90) {
        difficulty = "advanced";
      }
    }

    if (typeof this.userProfile.adaptiveDifficulty === "number") {
      const numericDifficulty = Math.min(
        Math.max(this.userProfile.adaptiveDifficulty, 1),
        5
      );
      const map = {
        1: "beginner",
        2: "beginner",
        3: "intermediate",
        4: "advanced",
        5: "expert",
      };
      difficulty = map[numericDifficulty];
    }

    if (this.openaiClient) {
      try {
        let prompt = `You are an adaptive learning engine for cybersecurity training.
User knowledge level: ${knowledgeLevel}
Recent success rate: ${successRate}%
Current risk persona: ${this.userProfile.riskPersona || "Unknown"}.`;

        if (behavioralData?.decisionTimeMs && behavioralData?.questionsAnswered) {
          const avgTime =
            Number(behavioralData.decisionTimeMs) /
            Math.max(Number(behavioralData.questionsAnswered) || 1, 1);

          prompt += ` Average decision time: ${Math.round(avgTime)} ms.`;
        }

        prompt += ` Choose exactly one difficulty from this list only:
beginner
intermediate
advanced
expert`;

        const resp = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an adaptive difficulty selector. Reply with exactly one word: beginner, intermediate, advanced, or expert.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 10,
        });

        const text =
          resp.choices?.[0]?.message?.content?.trim().toLowerCase() || "";

        if (["beginner", "intermediate", "advanced", "expert"].includes(text)) {
          difficulty = text;
        }
      } catch (e) {
        console.warn("adaptiveEngine OpenAI call failed:", e.message);
      }
    }

    return difficulty;
  }

  /**
   * Does this scenario match the criteria?
   */
  matchesCriteria(scenario, criteria = {}) {
    if (!scenario || typeof scenario !== "object") return false;

    const scenarioSkillTags = Array.isArray(scenario.skillTags) ? scenario.skillTags : [];
    const scenarioDifficulty = this.normalizeDifficulty(scenario.difficulty);

    const requestedSkills = Array.isArray(criteria.skillTags) ? criteria.skillTags : [];
    const requestedDifficulty = this.normalizeDifficulty(criteria.difficulty);
    const allowNearbyDifficulty = Boolean(criteria.allowNearbyDifficulty);

    const skillMatch =
      requestedSkills.length === 0 ||
      requestedSkills.some((skill) => scenarioSkillTags.includes(skill));

    const difficultyMatch = allowNearbyDifficulty
      ? this.getDifficultyNeighbors(requestedDifficulty).includes(scenarioDifficulty)
      : scenarioDifficulty === requestedDifficulty;

    return skillMatch && difficultyMatch;
  }

  /**
   * Rank scenarios by relevance and select the best
   */
  rankAndSelect(candidates, targetSkills = []) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return null;
    }

    const userId = this.userProfile.userId || this.userProfile.id || null;

    const ranked = candidates.map((scenario) => {
      let score = 0;
      const scenarioSkillTags = Array.isArray(scenario.skillTags) ? scenario.skillTags : [];

      targetSkills.forEach((skill, index) => {
        if (scenarioSkillTags.includes(skill)) {
          score += 100 - index * 20;
        }
      });

      const userCompletedMap =
        scenario.lastCompletedBy &&
        typeof scenario.lastCompletedBy === "object" &&
        userId
          ? scenario.lastCompletedBy
          : null;

      if (userCompletedMap && userCompletedMap[userId]) {
        score *= 0.7;
      }

      if (scenarioSkillTags.length > 0) {
        score += 10;
      }

      return { scenario, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked[0]?.scenario || candidates[0];
  }

  /**
   * Add AI tutor context to scenario
   */
  async enrichScenarioWithContext(
    scenario,
    prioritizedSkills = [],
    selectedDifficulty = "beginner",
    behavioralData = {}
  ) {
    const primarySkill = prioritizedSkills[0] || "core cybersecurity fundamentals";

    const suggestedApproach = this.suggestApproachFor(
      this.userProfile.riskPersona || "Unclassified"
    );

    const estimatedDifficulty =
      selectedDifficulty || (await this.calculateAppropriateDifficulty(behavioralData));

    return {
      ...scenario,
      adaptiveContext: {
        whySelected: `This scenario targets ${primarySkill}, which currently needs reinforcement.`,
        expectedLearning: `You'll strengthen your understanding of ${
          Array.isArray(scenario.skillTags) && scenario.skillTags.length > 0
            ? scenario.skillTags.join(", ")
            : "core security skills"
        }.`,
        estimatedDifficulty,
        suggestedApproach,
      },
    };
  }

  /**
   * Suggest tactical approach based on behavioral type
   */
  suggestApproachFor(persona) {
    const suggestions = {
      "Careful Defender": "Analysis mode: Careful Defender. Your meticulous pacing guarantees high precision. However, in live incident response (SANS Identification phase), threat actors exploit high dwell times. Practice accelerating your triage metrics without sacrificing parameter validation depth.",
      "Fast but Risky": "Analysis mode: Fast but Risky. Your swift command execution is valuable under active DDOS or rapid exfiltration. However, rushing without verifying checksums or nmap scan noisiness will trip IDS policies and trigger alert storms. Slow down to verify boundary conditions.",
      "Social Engineering Sensitive": "Analysis mode: Social Engineering Sensitive. You show strong intuition regarding trust-based deception vectors. Always backup your behavioral caution with deep technical validation checks (checking SMTP headers, validating mail relays).",
      "Recon Specialist": "Analysis mode: Recon Specialist. Excellent focus on gathering initial OSINT and active port scanning bounds. Remember to transition quickly from passive mapping to active isolation (iptables dropping) before the adversary registers your scanning footprint.",
      "Incident Responder": "Analysis mode: Incident Responder. You excel at rapid, tactical containment drops. Ensure your root-cause eradication (sanitizing web scripts, parameterizing queries) is as solid as your initial iptables shields to prevent persistence loops.",
      Unclassified: "Think carefully about each decision. Adopt the Zero Trust methodology: never trust, always verify packet flows, script arguments, and authentication parameters.",
    };

    return suggestions[persona] || "Think carefully about each decision and validate parameters before acting.";
  }
}

module.exports = AdaptiveScenarioEngine;