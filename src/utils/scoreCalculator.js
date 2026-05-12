export function calculateOverallScore(scores) {
  if (!scores) return 0;
  const { energy = 5, mood = 5, productivity = 5, social = 5 } = scores;
  return Math.round(((energy + mood + productivity + social) / 4) * 10) / 10;
}

export function getScoreColor(score) {
  if (score >= 7.5) return '#00d4b1';
  if (score >= 5) return '#f59e0b';
  return '#f87171';
}

export function getScoreLabel(score) {
  if (score >= 8.5) return 'Thriving';
  if (score >= 7) return 'Flourishing';
  if (score >= 5.5) return 'Steady';
  if (score >= 4) return 'Struggling';
  return 'Draining';
}

export function getNodeColor(score) {
  if (score >= 7) return '#00d4b1';
  if (score >= 5) return '#f59e0b';
  return '#f87171';
}

export function aggregateScores(predictions) {
  if (!predictions.length) return null;
  const keys = ['energy', 'mood', 'productivity', 'social', 'overall'];
  const result = {};
  for (const key of keys) {
    const vals = predictions.map(p => p?.scores?.[key]).filter(Boolean);
    result[key] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 5;
  }
  return result;
}
