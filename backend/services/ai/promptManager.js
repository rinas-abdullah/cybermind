function buildMentorPrompt(question, context, userLevel) {
  const normalizedContext = typeof context === "string" ? context : "training";
  const levelString = Number.isFinite(Number(userLevel)) ? `Level ${userLevel}` : "Learner";

  return `Answer the following cybersecurity training question for a ${levelString} learner. Context: ${normalizedContext}. Question: ${question}`;
}

function buildScenarioGenerationPrompt(topic, difficulty, count) {
  return `Generate ${count} cybersecurity training questions about ${topic} at ${difficulty} difficulty.`;
}

module.exports = {
  buildMentorPrompt,
  buildScenarioGenerationPrompt,
};
