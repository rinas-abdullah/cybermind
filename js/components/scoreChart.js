// src/components/scoreChart.js

export function renderScoreChart() {
  const canvas = document.getElementById("scoreChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Get history
  let history = [];
  try {
    history = JSON.parse(
      localStorage.getItem("cybermind_score_history") || "[]"
    );
  } catch (_) {
    history = [];
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px monospace";
  ctx.fillStyle = "#9ca3af";

  if (!history.length) {
    ctx.fillText("No score history yet.", 20, 40);
    return;
  }

  const padding = 30;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  const minScore = Math.min(...history);
  const maxScore = Math.max(...history);
  const range = maxScore - minScore || 1;

  const stepX = history.length > 1 ? width / (history.length - 1) : 0;

  const points = history.map((value, i) => {
    const x = padding + i * stepX;
    const normY = (value - minScore) / range;
    const y = padding + (1 - normY) * height;
    return { x, y, value };
  });

  // axes
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;

  // x-axis
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // y-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();

  // line
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "#22c55e";
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(`Min: ${minScore}`, padding, padding - 10);
  ctx.fillText(`Max: ${maxScore}`, padding + 120, padding - 10);
}
