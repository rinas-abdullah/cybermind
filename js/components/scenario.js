// src/components/scenario.js

import { scenarios } from "./scenarioData.js";
import { updateProgress } from "../utils/api.js";

// simple quiz state
const quizState = {
  questions: [],
  currentIndex: 0,
  total: 5,
  totalDelta: 0,
};

export function loadScenario() {
  const container = document.getElementById("scenarioContainer");
  if (!container) return;

  container.classList.remove("hidden");

  // Reset state for a new quiz
  quizState.questions = [];
  quizState.currentIndex = 0;
  quizState.totalDelta = 0;

  const totalScenarios = scenarios.length;
  for (let i = 0; i < quizState.total; i++) {
    const randomIndex = Math.floor(Math.random() * totalScenarios);
    quizState.questions.push(scenarios[randomIndex]);
  }

  renderCurrentQuestion(container);
}

function renderCurrentQuestion(container) {
  const idx = quizState.currentIndex;
  const scenario = quizState.questions[idx];

  const progressPercent = (idx / quizState.total) * 100;
  const isLast = idx === quizState.total - 1;

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
              <button
                class="choice"
                data-opt-index="${optIndex}">
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
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;

      const optIndex = Number(btn.dataset.optIndex);
      const option = scenario.options[optIndex];

      // ❗ Use real score (can be negative)
      const change = option.score;

      // Track this question's score change for summary
      quizState.totalDelta += change;

      // Apply score (negative allowed)
      applyScore(change);

      // Show explanation
      const expEl = document.getElementById(`exp-${idx}`);
      if (expEl) {
        expEl.textContent = option.explanation;
      }

      // Disable all answer buttons
      buttons.forEach((b) => {
        b.disabled = true;
        b.style.opacity = "0.6";
      });

      // Find correct answer (highest score)
      const maxScore = Math.max(...scenario.options.map((o) => o.score));
      const correctOptionIndex = scenario.options.findIndex(
        (o) => o.score === maxScore
      );

      // Highlight user's choice
      if (optIndex === correctOptionIndex) {
        // correct -> green
        btn.style.backgroundColor = "#16a34a";
        btn.style.color = "white";
      } else {
        // wrong -> red
        btn.style.backgroundColor = "#dc2626";
        btn.style.color = "white";
      }

      // Highlight the correct answer in green (if not already)
      const correctButton = container.querySelector(
        `.choice[data-opt-index="${correctOptionIndex}"]`
      );
      if (correctButton) {
        correctButton.style.backgroundColor = "#16a34a";
        correctButton.style.color = "white";
        correctButton.style.opacity = "1";
      }

      // Enable Next / Finish button
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

  const aiHtml = getAiAnalysis(quizState.total, delta, finalScore);

  container.innerHTML = `
    <div class="scenario quiz-summary">
      <h3>Quiz Complete</h3>
      <p>You answered ${quizState.total} questions.</p>
      <p>Total score change this quiz: <strong>${deltaLabel}</strong></p>
      <p>Your current score: <strong>${finalScore}</strong></p>

      ${aiHtml}

      <button id="nextQuizBtn">Next Quiz</button>
    </div>
  `;

  // Save progress to backend for learner continuity
  saveScenarioProgress(delta);

  const nextQuizBtn = document.getElementById("nextQuizBtn");
  if (nextQuizBtn) {
    nextQuizBtn.addEventListener("click", () => {
      loadScenario();
    });
  }
}

// 🔮 Fake AI “analysis”
function getAiAnalysis(totalQuestions, delta, finalScore) {
  if (totalQuestions === 0) return "";

  const maxPossible = totalQuestions * 100; // since best answers are 100
  const positiveRatio =
    maxPossible > 0 ? Math.max(delta, 0) / maxPossible : 0;

  let title = "AI Agent Feedback";
  let summary = "";
  const tips = [];

  if (delta <= 0) {
    summary =
      "The AI agent detected that you lost points this round. That’s actually useful: it highlights where attackers would succeed against you right now.";
    tips.push(
      "Look for options that involve reporting to IT/security or using official channels.",
      "Avoid clicking links, opening attachments, or installing software directly from emails and pop-ups.",
      "Treat unexpected messages, USB devices, and login prompts as suspicious until proven safe."
    );
  } else if (positiveRatio < 0.4) {
    summary =
      "Your decisions show an emerging awareness of cyber threats, but there are still several risky patterns.";
    tips.push(
      "Prioritize options that avoid clicking links or opening attachments directly from emails.",
      "When in doubt, report incidents instead of ignoring them or engaging with suspicious content.",
      "Ask: 'Is there a safer, more official way to handle this?' before choosing."
    );
  } else if (positiveRatio < 0.8) {
    summary =
      "You’re making mostly strong security decisions with a few gaps the AI has flagged.";
    tips.push(
      "You already avoid obvious traps — focus now on subtle risks like password sharing or insecure channels.",
      "Think about who else should be informed (IT, security teams) when something looks off."
    );
  } else {
    summary =
      "Excellent performance. Your decisions closely match what a security-aware professional would do.";
    tips.push(
      "Keep reinforcing these habits by imagining how you’d explain each choice to a security officer.",
      "You’re ready for more advanced scenarios with social engineering and insider threats."
    );
  }

  // Level-style label based on total score (can still show even if score is negative)
  const level =
    finalScore >= 1700
      ? "Legend"
      : finalScore >= 1300
      ? "Visionary"
      : finalScore >= 900
      ? "Voyager"
      : finalScore >= 600
      ? "Adept"
      : finalScore >= 300
      ? "Apprentice"
      : "Newbie";

  tips.push(
    `Current profile: the AI estimates your awareness level as **${level}** based on your total points.`
  );

  return `
    <div class="ai-analysis">
      <h4>${title}</h4>
      <p>${summary}</p>
      <ul>
        ${tips.map((tip) => `<li>${tip}</li>`).join("")}
      </ul>
    </div>
  `;
}

function applyScore(amount) {
  const username = localStorage.getItem("cybermind_user");

  if (!username) {
    alert("Session expired. Please log in again.");
    window.location.href = "/";
    return;
  }

  // amount can be positive or negative
  const numericAmount = Number(amount) || 0;

  fetch("http://localhost:3001/api/update-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, amount: numericAmount }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.updated) {
        const newScore = data.score;
        localStorage.setItem("cybermind_score", newScore);

        // update history
        let history = [];
        try {
          history = JSON.parse(
            localStorage.getItem("cybermind_score_history") || "[]" 
          );
        } catch (_) {
          history = [];
        }

        history.push(newScore);
        localStorage.setItem(
          "cybermind_score_history",
          JSON.stringify(history)
        );
      }
    })
    .catch((err) => {
      console.error("Error updating score:", err);
    });
}

// Save scenario progress for learner continuity
async function saveScenarioProgress(scoreDelta) {
  const username = localStorage.getItem("cybermind_user");
  if (!username) return;

  try {
    // For now, we'll save a generic scenario completion
    // In a real implementation, this would track specific scenarios
    const progressData = {
      username,
      scenarioId: "training-quiz", // Generic scenario ID
      score: scoreDelta,
      timeSpent: Math.floor(Math.random() * 300) + 60, // Mock time spent
      status: scoreDelta > 0 ? "completed" : "attempted"
    };

    await updateProgress(progressData);
    console.log("Progress saved successfully");
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}
