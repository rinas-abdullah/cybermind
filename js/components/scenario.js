// src/components/scenario.js

import { scenarios } from "./scenarioData.js";
import { updateProgress } from "../utils/api.js";
import { securityLogs } from "./securityLogs.js";

const quizState = {
  questions: [],
  currentIndex: 0,
  total: 5,
  totalDelta: 0,
  scenarioId: null,
  startTime: null,
  behavioralData: {
    decisionTimeMs: 0,
    warningsPresented: 0,
    warningsAcknowledged: 0,
    verificationsPerformed: 0,
    questionsAnswered: 0,
    timeLimited: false,
    decisions: [],
  },
};

export function loadScenario() {
  const container = document.getElementById("scenarioContainer");
  if (!container) return;

  container.classList.remove("hidden");

  quizState.questions = [];
  quizState.currentIndex = 0;
  quizState.totalDelta = 0;
  quizState.scenarioId = `scenario-${Date.now()}`;
  quizState.startTime = Date.now();
  quizState.behavioralData = {
    decisionTimeMs: 0,
    warningsPresented: 0,
    warningsAcknowledged: 0,
    verificationsPerformed: 0,
    questionsAnswered: 0,
    timeLimited: false,
    decisions: [],
  };

  securityLogs.init();
  securityLogs.logEvent("Starting new quiz session");

  loadAdaptiveScenario(container);
}

function getStoredUsername() {
  return (
    localStorage.getItem("username") ||
    localStorage.getItem("cybermind_user") ||
    "Guest"
  );
}

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function loadAdaptiveScenario(container) {
  const username = getStoredUsername();
  const lastBehavior = JSON.parse(
    localStorage.getItem("lastBehavioralData") || "{}"
  );

  try {
    const query =
      lastBehavior && Object.keys(lastBehavior).length
        ? `?behavioralData=${encodeURIComponent(JSON.stringify(lastBehavior))}`
        : "";

    const response = await fetch(
      `/api/ai/next-scenario/${encodeURIComponent(username)}${query}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (data.success && data.data) {
      const scenario = data.data;
      quizState.scenarioId = scenario.id || quizState.scenarioId;

      securityLogs.logEvent(
        `Loaded scenario: ${scenario.title || "adaptive"}`
      );

      await generateScenarioQuestions(scenario.skillTags || ["phishing"]);
      renderCurrentQuestion(container);
    } else {
      fallbackToStaticScenarios(container);
    }
  } catch (error) {
    console.error("Failed to load adaptive scenario:", error);
    securityLogs.logEvent("Adaptive load failed, using static content");
    fallbackToStaticScenarios(container);
  }
}

async function generateScenarioQuestions(skillTags) {
  try {
    const primarySkill = skillTags[0] || "phishing";

    const response = await fetch("/api/ai/generate-questions", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        topic: primarySkill,
        difficulty: "intermediate",
        count: quizState.total,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data && data.data.questions && Array.isArray(data.data.questions)) {
      quizState.questions = data.data.questions.map((q) => ({
        title: q.question,
        description: q.question,
        options: q.options && Array.isArray(q.options) ? q.options.map((opt, index) => ({
          text: opt,
          score: index === q.correctAnswer ? 100 : -50,
          explanation:
            index === q.correctAnswer
              ? `Correct! ${q.explanation}`
              : `Incorrect. ${q.explanation}`,
        })) : [],
      }));
    } else {
      throw new Error("Invalid data structure from API");
    }
  } catch (error) {
    console.error("Failed to generate questions:", error);

    const totalScenarios = scenarios.length;
    for (let i = 0; i < quizState.total; i++) {
      const randomIndex = Math.floor(Math.random() * totalScenarios);
      quizState.questions.push(scenarios[randomIndex]);
    }
  }
}

function fallbackToStaticScenarios(container) {
  const totalScenarios = scenarios.length;

  for (let i = 0; i < quizState.total; i++) {
    const randomIndex = Math.floor(Math.random() * totalScenarios);
    quizState.questions.push(scenarios[randomIndex]);
  }

  renderCurrentQuestion(container);
}

function renderCurrentQuestion(container) {
  container.classList.add("immersive-scenario");

  const idx = quizState.currentIndex;
  const scenario = quizState.questions[idx];

  if (!scenario) return;

  const progressPercent = (idx / quizState.total) * 100;
  const isLast = idx === quizState.total - 1;
  const questionStartTime = Date.now();

  container.innerHTML = `
    <div class="quiz-progress">
      <div class="quiz-progress-bar" style="width: ${progressPercent}%"></div>
    </div>

    <p class="quiz-progress-label">
      Question ${idx + 1} of ${quizState.total}
    </p>

    <div class="scenario scenario-question" data-q-index="${idx}">
      <h3>${scenario.title}</h3>
      <p>${scenario.description}</p>

      <div class="options">
        ${scenario.options
          .map(
            (opt, optIndex) => `
              <button class="choice" data-opt-index="${optIndex}">
                ${opt.text}
              </button>
            `
          )
          .join("")}
      </div>

      <p class="explanation" id="exp-${idx}"></p>

      <button id="nextQuestionBtn" disabled>
        ${isLast ? "Finish Quiz" : "Next Question"}
      </button>
    </div>
  `;

  const buttons = container.querySelectorAll(".choice");
  const nextBtn = document.getElementById("nextQuestionBtn");

  let answered = false;

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (answered) return;
      answered = true;

      const optIndex = Number(btn.dataset.optIndex);
      const option = scenario.options[optIndex];

      const decisionTime = Date.now() - questionStartTime;
      quizState.behavioralData.decisionTimeMs += decisionTime;
      quizState.behavioralData.questionsAnswered++;

      securityLogs.logEvent(
        `Answered question ${idx + 1}: selected option ${optIndex + 1}`
      );
      securityLogs.animateAttack(option.score > 0 ? "defend" : "breach");

      const change = Number(option.score) || 0;
      quizState.totalDelta += change;

      quizState.behavioralData.decisions.push({
        questionIndex: idx,
        chosenOption: optIndex,
        isCorrect: option.score > 0,
        decisionTime,
      });

      await applyScore(change);

      const expEl = document.getElementById(`exp-${idx}`);
      if (expEl) {
        if (option.score <= 0) {
          try {
            const correctOption = scenario.options.find((o) => o.score > 0);
            const aiExplanation = await getAIExplanation(
              scenario,
              option,
              correctOption
            );
            expEl.innerHTML = `<div class="ai-explanation">${aiExplanation}</div>`;
            securityLogs.logEvent("Displaying AI explanation for wrong answer");
          } catch (error) {
            expEl.textContent = option.explanation;
          }
        } else {
          expEl.textContent = option.explanation;
        }
      }

      buttons.forEach((b) => {
        b.disabled = true;
        b.style.opacity = "0.6";
      });

      const maxScore = Math.max(...scenario.options.map((o) => o.score));
      const correctOptionIndex = scenario.options.findIndex(
        (o) => o.score === maxScore
      );

      if (optIndex === correctOptionIndex) {
        btn.style.backgroundColor = "#16a34a";
        btn.style.color = "white";
      } else {
        btn.style.backgroundColor = "#dc2626";
        btn.style.color = "white";
      }

      const correctButton = container.querySelector(
        `.choice[data-opt-index="${correctOptionIndex}"]`
      );

      if (correctButton) {
        correctButton.style.backgroundColor = "#16a34a";
        correctButton.style.color = "white";
        correctButton.style.opacity = "1";
      }

      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.add("next-enabled");
      }
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!answered) {
        alert("Please answer the question first.");
        return;
      }

      if (quizState.currentIndex < quizState.total - 1) {
        quizState.currentIndex++;
        renderCurrentQuestion(container);
      } else {
        renderSummary(container);
      }
    });
  }
}

function renderSummary(container) {
  const finalScore = Number(localStorage.getItem("cybermind_score") || 0);
  const delta = quizState.totalDelta;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  localStorage.setItem(
    "lastBehavioralData",
    JSON.stringify(quizState.behavioralData)
  );

  container.innerHTML = `
    <div class="scenario quiz-summary">
      <h3>Quiz Complete</h3>
      <p>You answered ${quizState.total} questions.</p>
      <p>Total score change this quiz: <strong>${deltaLabel}</strong></p>
      <p>Your current score: <strong>${finalScore}</strong></p>

      <div id="aiFeedback" class="ai-analysis">
        <h4>AI Analysis Loading...</h4>
        <p>Generating personalized feedback...</p>
      </div>

      <button id="nextQuizBtn">Next Quiz</button>
    </div>
  `;

  processScenarioWithAI(delta);
  saveScenarioProgress(delta);

  const nextQuizBtn = document.getElementById("nextQuizBtn");
  if (nextQuizBtn) {
    nextQuizBtn.addEventListener("click", () => {
      loadScenario();
    });
  }
}

async function processScenarioWithAI(scoreDelta) {
  const username = getStoredUsername();
  if (username === "Guest") return;

  try {
    const incorrectAnswers = quizState.behavioralData.decisions
      .filter((d) => !d.isCorrect)
      .map((d) => ({
        questionIndex: d.questionIndex,
        userAnswer:
          quizState.questions[d.questionIndex].options[d.chosenOption].text,
        correctAnswer:
          quizState.questions[d.questionIndex].options.find((o) => o.score > 0)
            ?.text || "",
      }));

    const avgDecisionTime =
      quizState.behavioralData.questionsAnswered > 0
        ? Math.floor(
            quizState.behavioralData.decisionTimeMs /
              quizState.behavioralData.questionsAnswered
          )
        : 0;

    const response = await fetch("/api/ai/process-attempt", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        scenarioId: quizState.scenarioId,
        score: scoreDelta,
        timeSpent: Math.floor((Date.now() - quizState.startTime) / 1000),
        incorrectAnswers,
        behavioralData: {
          ...quizState.behavioralData,
          decisionTimeMs: avgDecisionTime,
          skillsInvolved: ["phishing", "general-security"],
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      displayAIFeedback(data.data);
    }
  } catch (error) {
    console.error("AI processing failed:", error);
  }
}

function displayAIFeedback(feedback) {
  securityLogs.logEvent("AI feedback received");

  const aiFeedbackEl = document.getElementById("aiFeedback");
  if (!aiFeedbackEl) return;

  const explanations = feedback.explanations || [];
  const behavioralInsights = feedback.behavioralInsights || {};
  const userProgressUpdate = feedback.userProgressUpdate || {};

  if (feedback.nextActions && feedback.nextActions.nextScenario) {
    securityLogs.animateAttack("defend");
  }

  aiFeedbackEl.innerHTML = `
    <h4>AI Training Analysis</h4>

    ${
      explanations.length > 0
        ? `
      <div class="ai-explanations">
        <h5>Key Learning Points:</h5>
        <ul>
          ${explanations
            .slice(0, 3)
            .map(
              (exp) => `<li>${exp.keyTakeaway || exp.summary || "Insight available"}</li>`
            )
            .join("")}
        </ul>
      </div>
    `
        : ""
    }

    ${
      userProgressUpdate.newPersona
        ? `
      <div class="persona-update">
        <h5>Your Learning Profile:</h5>
        <p><strong>Current Persona:</strong> ${userProgressUpdate.newPersona}</p>
        <p><strong>Knowledge Level:</strong> ${userProgressUpdate.newKnowledgeLevel || 0}/100</p>
      </div>
    `
        : ""
    }

    ${
      behavioralInsights.behavioralProfile
        ? `
      <div class="behavioral-insights">
        <h5>Behavioral Analysis:</h5>
        <p><strong>Decision Style:</strong> ${
          behavioralInsights.behavioralProfile.summary?.decisionSpeed || "Developing"
        }</p>
        <p><strong>Security Awareness:</strong> ${
          behavioralInsights.behavioralProfile.summary?.warningAwareness || "Building"
        }</p>
      </div>
    `
        : ""
    }

    <div class="next-steps">
      <h5>Recommended Next Steps:</h5>
      <p>${
        feedback.nextActions?.nextScenario ||
        "Continue practicing to improve your skills!"
      }</p>
    </div>

    <div class="feynman-tip">
      <em>Feynman Tip: Try explaining the above concepts in your own words or teach a peer — teaching is learning.</em>
    </div>
  `;
}

async function getAIExplanation(question, userAnswer, correctAnswer) {
  try {
    const response = await fetch("/api/ai/mentor", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        question: `Why is "${userAnswer.text}" wrong for: ${question.title}`,
        context: "scenario-explanation",
      }),
    });

    const data = await response.json();

    if (data.success) {
      return `
        <div class="ai-tutor-explanation">
          <h4>AI Tutor Explanation</h4>
          <p><strong>Why this was wrong:</strong> ${userAnswer.explanation}</p>
          <p><strong>Security Principle:</strong> ${data.data.explanation || ""}</p>
          <p><strong>Prevention:</strong> ${
            data.data.prevention?.[0] || "Always verify before acting"
          }</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("AI explanation failed:", error);
  }

  return userAnswer.explanation;
}

async function applyScore(amount) {
  const username = getStoredUsername();
  const token = localStorage.getItem("authToken");

  if (!username || username === "Guest" || !token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  const numericAmount = Number(amount) || 0;

  try {
    const res = await fetch("/api/update-score", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount: numericAmount }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      const newScore = data.data.points ?? 0;
      localStorage.setItem("cybermind_score", String(newScore));

      let history = [];
      try {
        history = JSON.parse(
          localStorage.getItem("cybermind_score_history") || "[]"
        );
      } catch {
        history = [];
      }

      history.push(newScore);
      localStorage.setItem(
        "cybermind_score_history",
        JSON.stringify(history)
      );
    }
  } catch (err) {
    console.error("Error updating score:", err);
  }
}

async function saveScenarioProgress(scoreDelta) {
  const username = getStoredUsername();
  if (!username || username === "Guest") return;

  try {
    const progressData = {
      scenarioId: "training-quiz",
      score: scoreDelta,
      timeSpent: Math.floor((Date.now() - quizState.startTime) / 1000),
      status: scoreDelta > 0 ? "completed" : "attempted",
    };

    await updateProgress(progressData);
    console.log("Progress saved successfully");
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}