function formatMentorResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") {
    return {
      explanation: "No explanation available.",
      examples: [],
      prevention: [],
      hint: "",
      topic: "",
      difficulty: "unknown",
    };
  }

  return {
    explanation: rawResponse.explanation || rawResponse.answer || "No explanation available.",
    examples: Array.isArray(rawResponse.examples) ? rawResponse.examples : [],
    prevention: Array.isArray(rawResponse.prevention) ? rawResponse.prevention : [],
    hint: rawResponse.hint || "",
    topic: rawResponse.topic || "",
    difficulty: rawResponse.difficulty || "intermediate",
  };
}

module.exports = {
  formatMentorResponse,
};
