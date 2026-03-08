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
      'principle-of-least-privilege': 'Grant users/systems only required permissions',
      'defense-in-depth': 'Use multiple layers of security controls',
      'zero-trust': 'Never trust, always verify - even internal traffic',
      'separation-of-duties': 'No single person should control entire security process',
      'fail-secure': 'System should remain secure if a component fails',
      'social-engineering-awareness': 'People can be the weakest link',
      'incident-response': 'Have a plan before an incident occurs'
    };

    this.attackVectors = {
      'phishing': 'Attackers impersonate trusted entities to extract credentials',
      'privilege-escalation': 'Unauthorized elevation of access rights',
      'network-recon': 'Systematic gathering of network information',
      'password-attack': 'Brute force or credential stuffing attempts',
      'social-engineering': 'Manipulation of human psychology',
      'malware': 'Malicious software designed to harm systems',
      'credential-theft': 'Stealing login information through various methods'
    };

    this.defensiveStrategies = {
      'verify-sources': 'Always verify the identity of message senders',
      'check-links': 'Hover over links before clicking, never use shortened URLs',
      'report-suspicious': 'Report suspicious activity immediately',
      'use-mfa': 'Enable multi-factor authentication everywhere',
      'strong-passwords': 'Use long, complex, unique passwords',
      'security-training': 'Stay educated on latest threats',
      'incident-response': 'Know the incident response procedures'
    };
  }

  /**
   * Generate comprehensive explanation for wrong answer
   */
  explainWrongAnswer(question, userAnswer, correctAnswer, scenarioContext) {
    return {
      summary: `You selected "${userAnswer}", but the correct answer is "${correctAnswer}"`,
      
      whyWrong: this.generateWhyWrong(question, userAnswer),
      
      principleViolated: this.identifyPrincipleViolated(question),
      
      realWorldContext: this.generateRealWorldContext(question, scenarioContext),
      
      defensiveMindset: this.suggestDefensiveMindset(question),
      
      keyTakeaway: this.generateKeyTakeaway(question, correctAnswer),
      
      situationalAnalysis: this.analyzeSituation(question, userAnswer, correctAnswer)
    };
  }

  /**
   * Explain why the selected answer was wrong
   */
  generateWhyWrong(question, userAnswer) {
    const reasons = {
      'social-engineering': `Choosing "${userAnswer}" would expose you to social engineering. Attackers often build trust before exploiting it.`,
      'privilege-escalation': `"${userAnswer}" doesn't follow least privilege principle. Always use minimum required access.`,
      'phishing': `"${userAnswer}" is a classic phishing indicator. Look for these red flags in future emails.`,
      'network-recon': `"${userAnswer}" would give an attacker more information. Minimize exposure during recon.`,
      'incident-response': `"${userAnswer}" would waste time. In incidents, prioritize by impact and severity.`,
      'password-attack': `"${userAnswer}" is vulnerable to password attacks. Weak passwords are easily compromised.`,
      'malware': `"${userAnswer}" increases malware infection risk. Never trust unfamiliar sources.`
    };
    
    return reasons[question.type] || `"${userAnswer}" doesn't follow security best practices.`;
  }

  /**
   * Identify which security principle was violated
   */
  identifyPrincipleViolated(question) {
    // Map question to principle
    const principleMap = {
      'phishing': 'zero-trust',
      'privilege-escalation': 'principle-of-least-privilege',
      'password-attack': 'principle-of-least-privilege',
      'social-engineering': 'defense-in-depth',
      'malware': 'defense-in-depth',
      'incident-response': 'fail-secure'
    };
    
    const principle = principleMap[question.type] || 'zero-trust';
    return {
      principle,
      description: this.securityPrinciples[principle]
    };
  }

  /**
   * Provide real-world attack context
   */
  generateRealWorldContext(question, scenarioContext) {
    const vector = question.type;
    
    return {
      attackVector: vector,
      description: this.attackVectors[vector] || 'Unknown attack vector',
      realWorldExample: `This type of attack happens frequently in ${scenarioContext?.industry || 'corporate'} environments`,
      industryImpact: `${scenarioContext?.industry || 'Finance'} industry experiences this attack ${scenarioContext?.frequency || 'regularly'}`,
      damageAssessment: `Successful exploitation could lead to ${scenarioContext?.impact || 'credential compromise and data theft'}`
    };
  }

  /**
   * Suggest defensive mindset improvements
   */
  suggestDefensiveMindset(question) {
    const strategies = {
      'phishing': ['Assume no email is safe until verified', 'Check sender address carefully', 'Never click links in emails'],
      'privilege-escalation': ['Request minimum necessary access', 'Review permissions regularly', 'Know why you need each permission'],
      'social-engineering': ['Be suspicious of unsolicited requests', 'Verify through independent channels', 'Trust is earned, not given'],
      'password-attack': ['Use unique, complex passwords', 'Enable MFA everywhere', 'Change compromised passwords immediately'],
      'incident-response': ['Stay calm and follow procedures', 'Prioritize by severity', 'Document everything']
    };
    
    const defaultStrategies = strategies[question.type] || ['Always verify', 'Think before acting', 'Ask for help when unsure'];
    
    return {
      mindset: `When facing ${question.type} scenarios, remember:`,
      strategies: defaultStrategies,
      whatToRemember: this.defensiveStrategies[strategies[question.type]?.[0]?.replace(/\s+/g, '-').toLowerCase()] || 'Always verify the source'
    };
  }

  /**
   * Generate key learning takeaway
   */
  generateKeyTakeaway(question, correctAnswer) {
    return {
      lesson: `The correct approach in this scenario is: ${correctAnswer}`,
      reasoning: `This choice aligns with security best practices and protects against ${question.type}`,
      rememberThis: `In future scenarios, when you see similar signs of ${question.type}, use this same defensive approach`,
      skillGained: `You're learning to recognize and respond to ${question.type} attacks`
    };
  }

  /**
   * Analyze the decision situation in depth
   */
  analyzeSituation(question, userAnswer, correctAnswer) {
    return {
      whatYouSaw: question.text,
      whatYouThought: `You thought "${userAnswer}" was the best choice`,
      whyThatSeemsSafe: `It might seem safe because...`,
      theHiddenDanger: `But the risk is that attackers use this exact reasoning to exploit people`,
      betterWay: `Instead, recognize the pattern and ${correctAnswer}`,
      practiceThis: `Scenario will reappear in different forms so you internalize this pattern`
    };
  }

  /**
   * Explain why scenario was selected for this user
   */
  explainScenarioSelection(scenarioMetadata, userProfile) {
    return {
      whySelected: scenarioMetadata.whySelected || `This scenario targets ${userProfile.weakestSkill}`,
      skillImprovement: `Completing this will strengthen your ability to detect ${userProfile.weakestSkill}`,
      difficulty: `Difficulty: ${userProfile.nextDifficulty} (adapted to your level)`,
      expectedLearning: `You'll learn how attackers exploit ${scenarioMetadata.skillTags?.join(', ')} vulnerabilities`,
      personalizedContext: `Based on your ${userProfile.riskPersona} behavioral pattern, this type of scenario will be most valuable for you`,
      progressNote: `You've completed ${userProfile.completedScenarios} scenarios; this is next in your adaptive path`
    };
  }

  /**
   * Explain difficulty progression
   */
  explainDifficultyChange(oldDifficulty, newDifficulty, userProfile) {
    const directions = {
      'beginner→intermediate': 'Your recent success rate has improved; we\'re escalating to challenge you appropriately.',
      'intermediate→beginner': 'We noticed some struggles; let\'s solidify fundamentals before advancing.',
      'intermediate→advanced': 'Your defensive thinking is sharp; time for expert-level scenarios.',
      'advanced→intermediate': 'These advanced scenarios are tough; let\'s find the right level for growth.'
    };
    
    const direction = `${oldDifficulty}→${newDifficulty}`;
    
    return {
      change: `Difficulty shifting from ${oldDifficulty} to ${newDifficulty}`,
      reason: directions[direction] || 'Adapting to your current skill level',
      whatsNext: `The next scenario will ${newDifficulty === 'advanced' ? 'push your limits' : 'build your foundation'}`,
      expectation: `Your ${newDifficulty} scenarios will have ${newDifficulty === 'advanced' ? 'more complex decisions and faster-paced situations' : 'clearer learning objectives'}`,
      howToApproach: `Take your time. These scenarios are designed to ${newDifficulty === 'advanced' ? 'teach advanced patterns' : 'reinforce critical concepts'}`
    };
  }

  /**
   * Generate comprehensive learning feedback report
   */
  generateLearningReport(userId, completedScenariosCount, skillMemory, riskProfile) {
    return {
      summary: {
        totalCompleted: completedScenariosCount,
        overallProgress: `You've built a solid foundation across ${skillMemory.length} skill areas`,
        currentLevel: riskProfile.knowledgeLevel,
        persona: riskProfile.riskPersona
      },

      strengths: this.identifyStrengths(skillMemory),
      
      areasForImprovement: this.identifyWeaknesses(skillMemory),
      
      recommendedFocus: this.recommendFocusAreas(skillMemory),
      
      motivationalMessage: this.generateMotivation(completedScenariosCount, riskProfile)
    };
  }

  /**
   * Identify user's strongest skills
   */
  identifyStrengths(skillMemory) {
    return skillMemory
      .filter(skill => skill.successRate > 0.8)
      .map(skill => ({
        skill: skill.skillName,
        confidence: skill.retentionConfidence,
        message: `You're demonstrating strong understanding of ${skill.skillName}`
      }));
  }

  /**
   * Identify areas needing improvement
   */
  identifyWeaknesses(skillMemory) {
    return skillMemory
      .filter(skill => skill.successRate < 0.6)
      .map(skill => ({
        skill: skill.skillName,
        failureRate: (1 - skill.successRate) * 100,
        message: `${skill.skillName} needs more focus. We'll reintroduce this in future scenarios.`
      }));
  }

  /**
   * Recommend focus areas
   */
  recommendFocusAreas(skillMemory) {
    const weakest = skillMemory
      .sort((a, b) => a.retentionConfidence - b.retentionConfidence)
      .slice(0, 3);
    
    return {
      primaryFocus: weakest.map(s => s.skillName),
      reasoning: `These areas show the highest room for improvement`,
      actionPlan: `We'll gradually reintroduce ${weakest[0]?.skillName} in upcoming scenarios`
    };
  }

  /**
   * Generate personalized motivation
   */
  generateMotivation(completedCount, riskProfile) {
    const milestones = {
      5: 'You\'ve completed 5 scenarios! You\'re building real security awareness.',
      10: 'Impressive! 10 scenarios down. Your behavioral patterns are improving.',
      20: '20 scenarios completed! You\'re thinking like a security professional.',
      50: 'Outstanding! 50 scenarios. You\'re developing true security intuition.'
    };
    
    const message = milestones[completedCount] || 
      `Great progress! You're ${completedCount} scenarios into your training.`;
    
    return {
      message,
      persona: `Your ${riskProfile.riskPersona} approach is helping you learn effectively`,
      nextMilestone: `Keep going! Your next milestone is challenging and will teach you critical skills.`
    };
  }
}

module.exports = ExplainableAITutor;
