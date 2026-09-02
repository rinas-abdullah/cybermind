class AIMentorService {
  normalizeRisk(risk) {
    if (!risk || typeof risk !== "object") {
      return {
        riskScore: 50,
        riskLevel: "medium",
        warnings: [],
      };
    }

    const score = Number(risk.riskScore ?? risk.score ?? 50);
    let level = String(risk.riskLevel || risk.level || "medium").toLowerCase();

    if (Number.isFinite(score)) {
      if (score >= 75) level = "high";
      else if (score <= 35) level = "low";
      else level = "medium";
    }

    const warnings = Array.isArray(risk.riskWarnings) ? risk.riskWarnings : [];

    return {
      riskScore: Math.max(0, Math.min(100, Number.isFinite(score) ? score : 50)),
      riskLevel: ["low", "medium", "high"].includes(level) ? level : "medium",
      warnings,
    };
  }

  normalizeBehavior(behavior) {
    if (!behavior || typeof behavior !== "object") {
      return {
        decisionVelocity: 0,
        warningAcknowledgment: 0,
        verificationBehavior: 0,
        pressurePerformance: 0,
        consistencyScore: 0,
      };
    }

    return {
      decisionVelocity: Number(behavior.decisionVelocity || 0),
      warningAcknowledgment: Number(behavior.warningAcknowledgment || 0),
      verificationBehavior: Number(
        behavior.verificationBehavior || behavior.verificationRate || 0
      ),
      pressurePerformance: Number(behavior.pressurePerformance || 0),
      consistencyScore: Number(behavior.consistencyScore || 0),
      scoreHistory: Array.isArray(behavior.scoreHistory) ? behavior.scoreHistory : [],
    };
  }

  summarizeAction(action) {
    const parsed = typeof action === "string" ? action.trim().toLowerCase() : "";

    if (!parsed) {
      return "No specific user action given; advice is general and applies to most security workflows.";
    }

    if (parsed.includes("click") && parsed.includes("link")) {
      return "User clicked a link; this commonly introduces phishing or malicious redirect risk.";
    }

    if (parsed.includes("download") || parsed.includes("file")) {
      return "User downloaded or opened a file; this may expose them to malware or exploitation if the source is untrusted.";
    }

    if (parsed.includes("password") || parsed.includes("credential")) {
      return "Involving credentials indicates high impact; protect secrets with MFA and avoid reuse.";
    }

    if (parsed.includes("admin") || parsed.includes("privilege")) {
      return "Privileged actions can escalate risk quickly; verify intent and principle of least privilege.";
    }

    return `Related activity: ${action.trim()}. Interpreted as potentially risky depending on input source and context.`;
  }

  recommend(riskLevel, behavior) {
    const recs = [];

    if (riskLevel === "high") {
      recs.push("Immediate mitigation is required: stop activity, verify origin, and escalate to incident response.");
    } else if (riskLevel === "medium") {
      recs.push("Review the behavior carefully, tighten checks, and follow security best practices.");
    } else {
      recs.push("Maintain current defenses and periodic review; continue reinforcing awareness training.");
    }

    if (behavior.warningAcknowledgment < 70) {
      recs.push("Improve warning recognition and response to reduce overlooked alerts.");
    }

    if (behavior.verificationBehavior < 60) {
      recs.push("Add a verification step before high-risk actions.");
    }

    if (behavior.pressurePerformance < 60) {
      recs.push("Practice scenarios under pressure to build consistent decision-making.");
    }

    if (behavior.consistencyScore < 50) {
      recs.push("Work on consistency across attempts to lower variance in performance.");
    }

    return [...new Set(recs)].slice(0, 4);
  }

  generateStructuredAdvice({ riskScore, behaviorAnalysis, userAction }) {
    const risk = this.normalizeRisk(riskScore);
    const behavior = this.normalizeBehavior(behaviorAnalysis);
    const actionSummary = this.summarizeAction(userAction);

    const summary = {
      risk: `${risk.riskLevel.toUpperCase()} (score: ${risk.riskScore})`,
      behavior: {
        decisionVelocity: behavior.decisionVelocity,
        warningAcknowledgment: behavior.warningAcknowledgment,
        verificationBehavior: behavior.verificationBehavior,
        pressurePerformance: behavior.pressurePerformance,
        consistencyScore: behavior.consistencyScore,
      },
      action: actionSummary,
    };

    const explanation =
      `Risk level determined as ${risk.riskLevel} (${risk.riskScore}%). ` +
      `Warning acknowledgment ${behavior.warningAcknowledgment}%, verification ${behavior.verificationBehavior}%, ` +
      `pressure performance ${behavior.pressurePerformance}%, and consistency ${behavior.consistencyScore}%.`;

    const real_world_impact =
      `If this behavior persists, the user may be vulnerable to real-world threats such as phishing, credential theft, or privilege abuse. ` +
      `Poor warning acknowledgment and verification are correlated with compromise in SOC post-mortems.`;

    const recommendation = this.recommend(risk.riskLevel, behavior);

    return {
      summary,
      explanation,
      real_world_impact,
      recommendation,
      source: "AI Mentor Service v1",
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = AIMentorService;