// ===== ADAPTIVE SCENARIO ENGINE =====

/**
 * Core algorithm that selects the next scenario based on:
 * - Learner's risk profile
 * - Skill gaps from memory
 * - Behavioral patterns
 * - Learning retention
 */

class AdaptiveScenarioEngine {
  constructor(userProfile, skillMemory, scenarioDatabase) {
    this.userProfile = userProfile;
    this.skillMemory = skillMemory;
    this.scenarioDatabase = scenarioDatabase;
  }

  /**
   * Select next scenario intelligently
   * @returns {Object} Selected scenario with metadata
   */
  selectNextScenario() {
    // Step 1: Identify most critical skill gaps
    const skillGaps = this.identifySkillGaps();
    
    // Step 2: Get weakest skills that need reinforcement
    const weakestSkills = this.getWeakestSkills();
    
    // Step 3: Calculate appropriate difficulty
    const targetDifficulty = this.calculateAppropriateDifficulty();
    
    // Step 4: Account for behavioral type
    const behavioralType = this.userProfile.riskPersona;
    
    // Step 5: Filter scenarios matching criteria
    const candidateScenarios = this.scenarioDatabase.filter(scenario => {
      return this.matchesCriteria(scenario, {
        skillTags: weakestSkills,
        difficulty: targetDifficulty,
        behavioralType: behavioralType
      });
    });
    
    // Step 6: Rank and select best match
    const selectedScenario = this.rankAndSelect(candidateScenarios, weakestSkills);
    
    // Step 7: Enrich with adaptive metadata
    return this.enrichScenarioWithContext(selectedScenario);
  }

  /**
   * Identify which skills the user is struggling with
   */
  identifySkillGaps() {
    const gaps = {};
    
    this.skillMemory.forEach(skill => {
      const failureRatio = skill.failureCount / (skill.failureCount + skill.successCount || 1);
      
      // Skills with > 30% failure rate are priority gaps
      if (failureRatio > 0.3) {
        gaps[skill.skillName] = {
          failureRatio,
          lastFailed: skill.lastFailed,
          priority: failureRatio * 100
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
    return this.skillMemory
      .filter(skill => skill.retentionConfidence < 70)
      .sort((a, b) => a.retentionConfidence - b.retentionConfidence)
      .slice(0, 3)
      .map(skill => skill.skillName);
  }

  /**
   * Calculate appropriate difficulty based on performance
   */
  calculateAppropriateDifficulty() {
    const knowledgeLevel = this.userProfile.knowledgeLevel;
    const successRate = this.userProfile.successRate;
    
    // Adjust difficulty based on recent performance
    if (successRate > 85) return 'advanced';
    if (successRate > 70) return 'intermediate';
    return 'beginner';
  }

  /**
   * Does this scenario match the criteria?
   */
  matchesCriteria(scenario, criteria) {
    const skillMatch = criteria.skillTags.some(skill => 
      scenario.skillTags.includes(skill)
    );
    
    const difficultyMatch = scenario.difficulty === criteria.difficulty;
    
    return skillMatch && difficultyMatch;
  }

  /**
   * Rank scenarios by relevance and select the best
   */
  rankAndSelect(candidates, targetSkills) {
    const ranked = candidates.map(scenario => {
      let score = 0;
      
      // Higher score for targeting weakest skill
      targetSkills.forEach((skill, index) => {
        if (scenario.skillTags.includes(skill)) {
          score += (100 - index * 20);
        }
      });
      
      // Prefer scenarios not recently done
      if (scenario.lastCompletedBy && scenario.lastCompletedBy[this.userProfile.userId]) {
        score *= 0.7; // Reduce score if user already did it
      }
      
      return { scenario, score };
    });
    
    ranked.sort((a, b) => b.score - a.score);
    return ranked[0]?.scenario || candidates[0];
  }

  /**
   * Add AI tutor context to scenario
   */
  enrichScenarioWithContext(scenario) {
    return {
      ...scenario,
      adaptiveContext: {
        whySelected: `This scenario targets ${this.identifySkillGaps()[0]}, which needs improvement`,
        expectedLearning: `You'll strengthen your understanding of ${scenario.skillTags.join(', ')}`,
        estimatedDifficulty: this.calculateAppropriateDifficulty(),
        suggestedApproach: this.suggestApproachFor(scenario)
      }
    };
  }

  /**
   * Suggest tactical approach based on behavioral type
   */
  suggestApproachFor(scenario) {
    const persona = this.userProfile.riskPersona;
    
    const suggestions = {
      'Careful Defender': 'Take your time. Verify each step.',
      'Fast but Risky': 'Stay methodical. Rushing leads to mistakes.',
      'Social Engineering Sensitive': 'Watch for social manipulation techniques.',
      'Recon Specialist': 'Gather information first before deciding.',
      'Incident Responder': 'Prioritize by severity. Act fast but smart.'
    };
    
    return suggestions[persona] || 'Think carefully about each decision.';
  }
}

module.exports = AdaptiveScenarioEngine;
