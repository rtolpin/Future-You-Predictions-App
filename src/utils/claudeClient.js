const API_BASE = '/api';

export async function simulateDecision({ action, timeSlot, profile, previousChoices, appearance }) {
  const res = await fetch(`${API_BASE}/simulate/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, timeSlot, profile, previousChoices, appearance }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function simulateDecisionStream({ action, timeSlot, profile, previousChoices, appearance, onDelta, onDone, onError }) {
  const res = await fetch(`${API_BASE}/simulate/decision/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, timeSlot, profile, previousChoices, appearance }),
  });

  if (!res.ok) {
    onError?.(`API error: ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const msg = JSON.parse(line.slice(6));
          if (msg.type === 'delta') onDelta?.(msg.text);
          else if (msg.type === 'done') onDone?.(msg.result);
          else if (msg.type === 'error') onError?.(msg.message);
        } catch {}
      }
    }
  }
}

export async function simulateDayFlow({ events, profile, mood, outfits }) {
  const res = await fetch(`${API_BASE}/simulate/day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, profile, mood, outfits }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function compareDays({ pathA, pathB, profile, mood, outfits }) {
  const res = await fetch(`${API_BASE}/simulate/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathA, pathB, profile, mood, outfits }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function simulateDecisionTree({ paths, nodeLabels, profile, mood, outfits }) {
  const res = await fetch(`${API_BASE}/simulate/tree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths, nodeLabels, profile, mood, outfits }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function generateRetrospective({ goals, goalOutcomes, reflection, actualEvents, profile, plannedEvents, actualMood, actualEnergy }) {
  const res = await fetch(`${API_BASE}/simulate/retrospective`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goals, goalOutcomes, reflection, actualEvents, profile, plannedEvents, actualMood, actualEnergy }),
  });
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try { const body = await res.json(); if (body?.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function generateDailySummary({ choices, profile }) {
  const res = await fetch(`${API_BASE}/simulate/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choices, profile }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
