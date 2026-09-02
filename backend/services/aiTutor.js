// ===== EXPLAINABLE AI TUTOR =====

/**
 * Provides intelligent explanations and learning feedback
 * Explains:
 * - Why answers were wrong
 * - Security principles violated
 * - Real-world attack context
 * - Defensive mindset
 * - Why scenario was selected
 * - Skill improvement areas
 */

class ExplainableAITutor {
  constructor() {
    this.securityPrinciples = {
      "principle-of-least-privilege":
        "Grant users and systems only the permissions they actually need.",
      "defense-in-depth":
        "Use multiple layers of security controls rather than relying on one defense.",
      "zero-trust":
        "Never trust automatically; always verify identities, actions, and access requests.",
      "separation-of-duties":
        "No single person should control the full sensitive process alone.",
      "fail-secure":
        "If a component fails, the system should fail in a secure state.",
      "social-engineering-awareness":
        "People can be manipulated, so human trust boundaries must be protected.",
      "incident-response":
        "Prepare and follow a response plan before incidents happen."
    };

    this.attackVectors = {
      phishing:
        "Attackers impersonate trusted entities to steal credentials or trigger risky actions.",
      "privilege-escalation":
        "An attacker gains higher access rights than they should have.",
      "network-recon":
        "An attacker gathers information about systems, services, and network structure.",
      "password-attack":
        "An attacker attempts to guess, reuse, or brute-force credentials.",
      "social-engineering":
        "An attacker manipulates human psychology to bypass technical defenses.",
      malware:
        "Malicious software is used to damage systems, steal data, or create persistence.",
      "credential-theft":
        "Login credentials are stolen through deception, malware, or interception."
    };

    this.defensiveStrategies = {
      "verify-sources": "Always verify the identity of the sender or requester.",
      "check-links":
        "Inspect links before clicking and avoid shortened or suspicious URLs.",
      "report-suspicious":
        "Report suspicious activity early so it can be contained quickly.",
      "use-mfa": "Use multi-factor authentication to reduce credential abuse risk.",
      "strong-passwords":
        "Use long, unique passwords and store them securely with a password manager.",
      "security-training":
        "Stay aware of current threats and train regularly on new attack patterns.",
      "incident-response":
        "Follow response procedures calmly and prioritize actions by severity."
    };

    this.typeToPrincipleMap = {
      phishing: "zero-trust",
      "privilege-escalation": "principle-of-least-privilege",
      "password-attack": "principle-of-least-privilege",
      "social-engineering": "social-engineering-awareness",
      malware: "defense-in-depth",
      "incident-response": "fail-secure",
      "network-recon": "defense-in-depth",
      "credential-theft": "zero-trust"
    };

    this.typeToMindset = {
      phishing: {
        mindset: "Assume messages are untrusted until verified.",
        strategies: [
          "Check sender identity carefully",
          "Verify requests through another trusted channel",
          "Avoid clicking links directly from unexpected messages"
        ],
        rememberKey: "verify-sources"
      },
      "privilege-escalation": {
        mindset: "Access should always be minimal and justified.",
        strategies: [
          "Use only the permissions you truly need",
          "Review privilege requests carefully",
          "Treat unnecessary access as a risk indicator"
        ],
        rememberKey: "strong-passwords"
      },
      "social-engineering": {
        mindset: "Trust should be verified, not assumed.",
        strategies: [
          "Be suspicious of urgency and emotional pressure",
          "Verify identity independently",
          "Pause before acting on unusual requests"
        ],
        rememberKey: "verify-sources"
      },
      "password-attack": {
        mindset: "Assume passwords will be targeted eventually.",
        strategies: [
          "Use unique passwords for each account",
          "Enable MFA wherever possible",
          "Change compromised credentials quickly"
        ],
        rememberKey: "use-mfa"
      },
      "incident-response": {
        mindset: "Stay calm, structured, and prioritize by impact.",
        strategies: [
          "Follow the incident workflow",
          "Document your actions",
          "Contain the highest-risk issue first"
        ],
        rememberKey: "incident-response"
      },
      malware: {
        mindset: "Treat unknown files, downloads, and execution paths as risky.",
        strategies: [
          "Do not trust unfamiliar attachments",
          "Validate sources before opening files",
          "Escalate suspicious behavior early"
        ],
        rememberKey: "report-suspicious"
      },
      "network-recon": {
        mindset: "Information exposure often happens before active exploitation.",
        strategies: [
          "Reduce unnecessary exposed services",
          "Limit visible metadata and banners",
          "Treat reconnaissance as part of the attack path"
        ],
        rememberKey: "security-training"
      },
      "credential-theft": {
        mindset: "Credentials are high-value targets and must be strongly protected.",
        strategies: [
          "Use MFA and strong password hygiene",
          "Watch for fake login pages",
          "Report suspicious authentication prompts"
        ],
        rememberKey: "use-mfa"
      }
    };
  }

  // ==================================================
  // HELPERS
  // ==================================================

  safeString(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  normalizeQuestion(question = {}) {
    if (!question || typeof question !== "object") {
      return {
        type: "general",
        text: "No question text provided"
      };
    }

    return {
      type: this.safeString(question.type, "general").toLowerCase(),
      text: this.safeString(question.text, "No question text provided")
    };
  }

  normalizeRiskProfile(riskProfile = {}) {
    return {
      knowledgeLevel: this.safeNumber(riskProfile.knowledgeLevel, 1),
      riskPersona: this.safeString(riskProfile.riskPersona, "Unclassified"),
      weakestSkill: this.safeString(riskProfile.weakestSkill, "core security awareness"),
      nextDifficulty: this.safeString(riskProfile.nextDifficulty, "intermediate")
    };
  }

  normalizeSkillMemory(skillMemory = []) {
    return this.safeArray(skillMemory)
      .filter((skill) => skill && typeof skill === "object")
      .map((skill) => ({
        skillName: this.safeString(skill.skillName, "unknown-skill"),
        successRate: Math.min(Math.max(this.safeNumber(skill.successRate, 0), 0), 1),
        retentionConfidence: Math.min(
          Math.max(this.safeNumber(skill.retentionConfidence, 0), 0),
          100
        ),
        failureCount: Math.max(this.safeNumber(skill.failureCount, 0), 0),
        successCount: Math.max(this.safeNumber(skill.successCount, 0), 0)
      }));
  }

  normalizeScenarioMetadata(scenarioMetadata = {}) {
    return {
      whySelected: this.safeString(scenarioMetadata.whySelected, ""),
      skillTags: this.safeArray(scenarioMetadata.skillTags)
        .filter((tag) => typeof tag === "string" && tag.trim())
        .map((tag) => tag.trim())
    };
  }

  // ==================================================
  // CORE EXPLANATION METHODS
  // ==================================================

  /**
   * Generate comprehensive explanation for wrong answer
   */
  explainWrongAnswer(question, userAnswer, correctAnswer, scenarioContext = {}) {
    const normalizedQuestion = this.normalizeQuestion(question);
    const safeUserAnswer = this.safeString(userAnswer, "an unsafe option");
    const safeCorrectAnswer = this.safeString(correctAnswer, "the safer option");

    return {
      summary: `You selected "${safeUserAnswer}", but the stronger defensive choice is "${safeCorrectAnswer}".`,
      whyWrong: this.generateWhyWrong(normalizedQuestion, safeUserAnswer),
      principleViolated: this.identifyPrincipleViolated(normalizedQuestion),
      realWorldContext: this.generateRealWorldContext(
        normalizedQuestion,
        scenarioContext
      ),
      defensiveMindset: this.suggestDefensiveMindset(normalizedQuestion),
      keyTakeaway: this.generateKeyTakeaway(
        normalizedQuestion,
        safeCorrectAnswer
      ),
      situationalAnalysis: this.analyzeSituation(
        normalizedQuestion,
        safeUserAnswer,
        safeCorrectAnswer
      )
    };
  }

  /**
   * Explain why the selected answer was wrong
   */
  generateWhyWrong(question, userAnswer) {
    const reasons = {
      "social-engineering": `Choosing "${userAnswer}" would make you more vulnerable to social engineering. Attackers often create pressure or trust to bypass careful thinking.`,
      "privilege-escalation": `"${userAnswer}" conflicts with least privilege. Security improves when access stays as limited as possible.`,
      phishing: `"${userAnswer}" matches a common phishing risk pattern. Suspicious requests should be verified before action.`,
      "network-recon": `"${userAnswer}" could expose more information than necessary. Reconnaissance becomes dangerous when defenders reveal useful details.`,
      "incident-response": `"${userAnswer}" may slow the response or mis-prioritize the situation. In incidents, speed must be balanced with correct prioritization.`,
      "password-attack": `"${userAnswer}" creates unnecessary password risk. Weak or reused credentials are frequent attack targets.`,
      malware: `"${userAnswer}" increases malware exposure. Untrusted files, links, or execution steps should be handled cautiously.`,
      "credential-theft": `"${userAnswer}" could increase the chance of credential compromise. Authentication requests should be validated carefully.`
    };

    return (
      reasons[question.type] ||
      `"${userAnswer}" does not align well with secure decision-making in this situation.`
    );
  }

  /**
   * Identify which security principle was violated
   */
  identifyPrincipleViolated(question) {
    const principle =
      this.typeToPrincipleMap[question.type] || "zero-trust";

    return {
      principle,
      description:
        this.securityPrinciples[principle] ||
        "Always verify before trusting."
    };
  }

  /**
   * Provide real-world attack context
   */
  generateRealWorldContext(question, scenarioContext = {}) {
    const vector = question.type || "general";
    const industry = this.safeString(scenarioContext.industry, "enterprise");
    const frequency = this.safeString(scenarioContext.frequency, "frequently");
    const impact = this.safeString(
      scenarioContext.impact,
      "credential theft, data exposure, or operational disruption"
    );

    return {
      attackVector: vector,
      description:
        this.attackVectors[vector] || "This attack pattern appears in real environments.",
      realWorldExample: `This type of issue appears regularly in ${industry} environments.`,
      industryImpact: `Organizations in ${industry} often encounter this risk ${frequency}.`,
      damageAssessment: `If exploited successfully, it could lead to ${impact}.`
    };
  }

  /**
   * Suggest defensive mindset improvements
   */
  suggestDefensiveMindset(question) {
    const config =
      this.typeToMindset[question.type] || {
        mindset: "Think critically and verify before acting.",
        strategies: [
          "Pause before responding",
          "Verify the source independently",
          "Escalate if you are uncertain"
        ],
        rememberKey: "verify-sources"
      };

    return {
      mindset: `When facing ${question.type || "security"} scenarios, remember: ${config.mindset}`,
      strategies: config.strategies,
      whatToRemember:
        this.defensiveStrategies[config.rememberKey] ||
        "Always verify the source before acting."
    };
  }

  /**
   * Generate key learning takeaway
   */
  generateKeyTakeaway(question, correctAnswer) {
    return {
      lesson: `A stronger response in this scenario is: ${correctAnswer}`,
      reasoning: `This choice better aligns with secure behavior and reduces exposure to ${question.type || "security threats"}.`,
      rememberThis: `When you notice similar signals in future ${question.type || "security"} scenarios, pause, verify, and choose the defensive path.`,
      skillGained: `You are improving your ability to detect and respond to ${question.type || "security"} risks.`
    };
  }

  /**
   * Analyze the decision situation in depth
   */
  analyzeSituation(question, userAnswer, correctAnswer) {
    return {
      whatYouSaw: question.text,
      whatYouThought: `You believed "${userAnswer}" was the safest or most reasonable action.`,
      whyThatSeemsSafe:
        "It may have felt acceptable because attackers often design situations to look normal, urgent, or trustworthy.",
      theHiddenDanger:
        "The hidden risk is that attackers rely on natural human assumptions, especially under pressure or uncertainty.",
      betterWay: `A stronger approach is to recognize the pattern early and choose: ${correctAnswer}.`,
      practiceThis:
        "This pattern may return in different forms so you build long-term defensive recognition, not just one-time memory."
    };
  }

  /**
   * Explain why scenario was selected for this user
   */
  explainScenarioSelection(scenarioMetadata, userProfile) {
    const normalizedScenario = this.normalizeScenarioMetadata(scenarioMetadata);
    const profile = this.normalizeRiskProfile(userProfile);

    return {
      whySelected:
        normalizedScenario.whySelected ||
        `This scenario was selected to improve your weaker area: ${profile.weakestSkill}.`,
      skillImprovement: `Completing this scenario should strengthen your ability to detect and respond to ${profile.weakestSkill}.`,
      difficulty: `Difficulty: ${profile.nextDifficulty} (adapted to your current level).`,
      expectedLearning: `You are expected to build stronger recognition around ${
        normalizedScenario.skillTags.length > 0
          ? normalizedScenario.skillTags.join(", ")
          : "core security decision-making"
      }.`,
      personalizedContext: `Based on your ${profile.riskPersona} behavioral pattern, this scenario should be especially valuable for your learning path.`,
      progressNote: `This scenario is part of your adaptive progression and is meant to reinforce the next important security behavior.`
    };
  }

  /**
   * Explain difficulty progression
   */
  explainDifficultyChange(oldDifficulty, newDifficulty, userProfile = {}) {
    const oldDiff = this.safeString(oldDifficulty, "current");
    const newDiff = this.safeString(newDifficulty, "next");
    const profile = this.normalizeRiskProfile(userProfile);

    const directions = {
      "beginner→intermediate":
        "Your recent performance suggests you are ready for more challenging decisions.",
      "intermediate→beginner":
        "Recent struggles suggest your fundamentals need reinforcement before moving forward.",
      "intermediate→advanced":
        "Your defensive thinking is improving, so the system is increasing complexity.",
      "advanced→intermediate":
        "The current challenge level may be too steep right now, so the path is adjusting for better learning.",
      "advanced→expert":
        "Your performance suggests you are ready for highly demanding, multi-step scenarios.",
      "expert→advanced":
        "The system is lowering difficulty slightly to improve retention and consistency."
    };

    const direction = `${oldDiff}→${newDiff}`;

    return {
      change: `Difficulty is shifting from ${oldDiff} to ${newDiff}.`,
      reason: directions[direction] || "The system is adapting to your current skill and retention level.",
      whatsNext:
        newDiff === "advanced" || newDiff === "expert"
          ? "The next scenarios will demand faster judgment and more complex pattern recognition."
          : "The next scenarios will reinforce fundamentals and improve consistency.",
      expectation: `Your ${newDiff} scenarios will be tailored to your ${profile.riskPersona} profile and current learning needs.`,
      howToApproach:
        newDiff === "advanced" || newDiff === "expert"
          ? "Stay methodical. Higher difficulty rewards careful prioritization and pattern recognition."
          : "Focus on fundamentals, verification, and understanding why the safer option works."
    };
  }

  /**
   * Generate comprehensive learning feedback report
   */
  generateLearningReport(userId, completedScenariosCount, skillMemory, riskProfile) {
    const normalizedSkills = this.normalizeSkillMemory(skillMemory);
    const profile = this.normalizeRiskProfile(riskProfile);
    const totalCompleted = Math.max(this.safeNumber(completedScenariosCount, 0), 0);

    return {
      summary: {
        userId: userId ?? null,
        totalCompleted,
        overallProgress:
          normalizedSkills.length > 0
            ? `You have built experience across ${normalizedSkills.length} skill areas.`
            : "You are still building your first measurable skill patterns.",
        currentLevel: profile.knowledgeLevel,
        persona: profile.riskPersona
      },

      strengths: this.identifyStrengths(normalizedSkills),

      areasForImprovement: this.identifyWeaknesses(normalizedSkills),

      recommendedFocus: this.recommendFocusAreas(normalizedSkills),

      motivationalMessage: this.generateMotivation(totalCompleted, profile)
    };
  }

  /**
   * Identify user's strongest skills
   */
  identifyStrengths(skillMemory) {
    const normalizedSkills = this.normalizeSkillMemory(skillMemory);

    const strengths = normalizedSkills
      .filter((skill) => skill.successRate >= 0.8)
      .map((skill) => ({
        skill: skill.skillName,
        confidence: skill.retentionConfidence,
        message: `You are showing strong understanding in ${skill.skillName}.`
      }));

    if (strengths.length === 0) {
      return [
        {
          skill: "developing-foundation",
          confidence: 0,
          message: "Your strongest patterns are still forming. Keep practicing to build consistent strengths."
        }
      ];
    }

    return strengths;
  }

  /**
   * Identify areas needing improvement
   */
  identifyWeaknesses(skillMemory) {
    const normalizedSkills = this.normalizeSkillMemory(skillMemory);

    const weaknesses = normalizedSkills
      .filter((skill) => skill.successRate < 0.6)
      .map((skill) => ({
        skill: skill.skillName,
        failureRate: Math.round((1 - skill.successRate) * 100),
        message: `${skill.skillName} needs more attention. It will likely reappear in future adaptive scenarios.`
      }));

    if (weaknesses.length === 0) {
      return [
        {
          skill: "no-major-weakness-detected",
          failureRate: 0,
          message: "No major weak area is currently standing out. Focus on consistency and retention."
        }
      ];
    }

    return weaknesses;
  }

  /**
   * Recommend focus areas
   */
  recommendFocusAreas(skillMemory) {
    const normalizedSkills = this.normalizeSkillMemory(skillMemory);

    const weakest = [...normalizedSkills]
      .sort((a, b) => a.retentionConfidence - b.retentionConfidence)
      .slice(0, 3);

    return {
      primaryFocus: weakest.map((s) => s.skillName),
      reasoning:
        weakest.length > 0
          ? "These skills currently show the greatest room for reinforcement."
          : "More practice data is needed before a focus area can be prioritized confidently.",
      actionPlan:
        weakest.length > 0
          ? `The system should gradually reintroduce ${weakest[0].skillName} and related concepts.`
          : "Continue practicing foundational scenarios to build a clearer adaptive path."
    };
  }

  /**
   * Generate personalized motivation
   */
  generateMotivation(completedCount, riskProfile) {
    const profile = this.normalizeRiskProfile(riskProfile);

    const milestones = {
      5: "You have completed 5 scenarios. Your security awareness is starting to become more structured.",
      10: "Great work. At 10 scenarios, your behavioral patterns are becoming more measurable.",
      20: "Excellent progress. At 20 scenarios, you are building real defensive intuition.",
      50: "Outstanding work. At 50 scenarios, your security mindset is becoming much more mature and consistent."
    };

    const message =
      milestones[completedCount] ||
      `You have completed ${completedCount} scenarios. Consistent repetition is how strong security instincts are built.`;

    return {
      message,
      persona: `Your current learning style reflects a ${profile.riskPersona} pattern.`,
      nextMilestone:
        "Keep going. The next stage of training will help reinforce critical recognition and decision skills."
    };
  }
}

module.exports = ExplainableAITutor;