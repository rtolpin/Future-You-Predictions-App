import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function extractText(response) {
  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text block in response');
  return block.text.trim();
}

function buildSystemPrompt(profile) {
  return `You are "Future You" — an empathetic, insightful AI life simulator. Your job is to help users understand how their daily choices shape their emotional state, social environment, and long-term identity.

You are NOT giving advice. You are simulating realistic outcomes based on psychology, sociology, and behavioral science.

Always be:
- Realistic and grounded (not toxic positivity, not doom-saying)
- Empathetic and non-judgmental about the user's current circumstances
- Specific to their location, time of day, appearance, and life situation
- Vivid but concise — give predictions in short, punchy paragraphs

User Profile:
${JSON.stringify(profile, null, 2)}

Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function buildDecisionPrompt(action, timeSlot, profile, previousChoices, appearance) {
  return `The user has chosen to: ${action}

Time: ${timeSlot}
Current appearance: ${appearance || 'unspecified'}
City: ${profile.city || 'New York'}
Choices made so far today: ${previousChoices?.length ? previousChoices.join(', ') : 'This is their first choice'}

Please provide a vivid, realistic simulation in this EXACT JSON format:

{
  "scene": "2-3 sentences describing who will realistically be around them and what the environment will feel like",
  "immediateFeel": "2-3 sentences on how they will feel in the next 1-2 hours",
  "endOfDayFeel": "1-2 sentences on how this affects mood and energy by tonight",
  "rippleEffect": "2-3 sentences on how repeated for a week shapes who they are becoming",
  "scores": {
    "energy": 0-10,
    "mood": 0-10,
    "productivity": 0-10,
    "social": 0-10,
    "overall": 0-10
  },
  "nextChoices": ["option A", "option B", "option C", "option D"]
}

Be specific, empathetic, and grounded. Return ONLY valid JSON.`;
}

export async function simulateDecision({ action, timeSlot, profile, previousChoices, appearance }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(profile),
    messages: [{ role: 'user', content: buildDecisionPrompt(action, timeSlot, profile, previousChoices, appearance) }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

export async function simulateDecisionStream({ action, timeSlot, profile, previousChoices, appearance, res }) {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(profile),
    messages: [{ role: 'user', content: buildDecisionPrompt(action, timeSlot, profile, previousChoices, appearance) }],
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullText = '';

  stream.on('text', (text) => {
    fullText += text;
    res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
  });

  stream.on('finalMessage', () => {
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.write(`data: ${JSON.stringify({ type: 'done', result: parsed })}\n\n`);
      }
    } catch {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Parse error' })}\n\n`);
    }
    res.end();
  });

  stream.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  });
}

export async function simulateDayFlow({ events, profile, mood, outfits }) {
  const eventList = events
    .map(e => `- ${e.time}: ${e.label}${e.duration ? ` (${e.duration} min)` : ''}`)
    .join('\n');

  const prompt = `You are simulating a complete day for the user. Here are ALL their planned activities in chronological order:

${eventList}

User Profile:
- City: ${profile?.city || 'New York'}
- Age: ${profile?.age || 'unknown'}
- Age Range: ${profile?.ageRange || 'unspecified'}
- Employment: ${profile?.employment || 'unspecified'}
- Gender Identity: ${profile?.genderIdentity || 'unspecified'}
- Appearance: ${profile?.appearance || 'unspecified'}
- Starting Mood: ${mood || profile?.mood || 'neutral'}
- Outfit(s): ${outfits?.length ? outfits.join(', ') : 'unspecified'}
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Create a vivid, holistic day simulation. Each activity must be understood in context of the FULL day — how it connects to what came before and after. Be specific to their city, time of day, and personal profile. Return ONLY valid JSON in this exact format:

{
  "dayTitle": "A poetic, evocative 3-5 word title for today (e.g. 'The Grounded Builder', 'A Social Storm', 'Quiet Power Day')",
  "dayOpening": "2-3 sentences painting the emotional texture of this entire day — what kind of day is this and what overarching feeling will define it?",
  "eventFlow": [
    {
      "label": "exact event label from the list above",
      "time": "HH:MM",
      "insight": "2-3 sentences: what this moment feels like, who or what is around them, and how it connects to the rest of the day's flow"
    }
  ],
  "momentum": "2-3 sentences describing the narrative arc of the day — how the activities build on each other and create cumulative energy or drag",
  "endOfDay": "2-3 sentences: how they feel by evening — physical energy, emotional state, sense of accomplishment or regret",
  "identity": "1-2 powerful sentences: what this day, repeated over time, says about who they are becoming",
  "scores": {
    "energy": <integer 0-10>,
    "mood": <integer 0-10>,
    "productivity": <integer 0-10>,
    "social": <integer 0-10>,
    "overall": <integer 0-10>
  },
  "thirtyDayImpact": "2-3 sentences: if they repeat this exact day pattern for 30 days, who do they become and what tangibly changes in their life?"
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

export async function compareDays({ pathA, pathB, profile, mood, outfits }) {
  const fmt = (path) => path.events
    .map(e => `  - ${e.time}: ${e.label}${e.duration ? ` (${e.duration} min)` : ''}`)
    .join('\n');

  const prompt = `You are comparing two completely different days for the same person. Simulate both days AND produce a detailed head-to-head comparison.

USER PROFILE:
- City: ${profile?.city || 'New York'}
- Age: ${profile?.age || 'unspecified'}
- Age Range: ${profile?.ageRange || 'unspecified'}
- Employment: ${profile?.employment || 'unspecified'}
- Gender Identity: ${profile?.genderIdentity || 'unspecified'}
- Appearance: ${profile?.appearance || 'unspecified'}
- Starting Mood: ${mood || 'neutral'}
- Outfit(s): ${outfits?.length ? outfits.join(', ') : 'unspecified'}
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

PATH A — "${pathA.label}":
${fmt(pathA)}

PATH B — "${pathB.label}":
${fmt(pathB)}

Simulate both days fully, then compare them head-to-head. Return ONLY valid JSON in this exact format:

{
  "pathA": {
    "dayTitle": "poetic 3-5 word title",
    "dayOpening": "2-3 sentences painting the emotional texture of this day",
    "eventFlow": [{ "label": "event label", "time": "HH:MM", "insight": "2-3 sentences in context of the full day" }],
    "momentum": "2-3 sentences on how the day builds",
    "endOfDay": "2-3 sentences on how they feel by evening",
    "identity": "1-2 sentences on who they're becoming",
    "scores": { "energy": 0-10, "mood": 0-10, "productivity": 0-10, "social": 0-10, "overall": 0-10 },
    "thirtyDayImpact": "2-3 sentences on 30-day projection"
  },
  "pathB": {
    "dayTitle": "poetic 3-5 word title",
    "dayOpening": "2-3 sentences",
    "eventFlow": [{ "label": "event label", "time": "HH:MM", "insight": "2-3 sentences" }],
    "momentum": "2-3 sentences",
    "endOfDay": "2-3 sentences",
    "identity": "1-2 sentences",
    "scores": { "energy": 0-10, "mood": 0-10, "productivity": 0-10, "social": 0-10, "overall": 0-10 },
    "thirtyDayImpact": "2-3 sentences"
  },
  "comparison": {
    "headline": "1 punchy sentence capturing the core difference between these two days",
    "winner": "A" or "B" or "tie",
    "winnerReason": "2-3 sentences explaining which path wins overall and why",
    "dimensions": [
      { "label": "Energy & Body", "edgeWinner": "A" or "B" or "tie", "pathASummary": "1 sentence", "pathBSummary": "1 sentence" },
      { "label": "Mental Focus", "edgeWinner": "A" or "B" or "tie", "pathASummary": "1 sentence", "pathBSummary": "1 sentence" },
      { "label": "Emotional Mood", "edgeWinner": "A" or "B" or "tie", "pathASummary": "1 sentence", "pathBSummary": "1 sentence" },
      { "label": "Social Connection", "edgeWinner": "A" or "B" or "tie", "pathASummary": "1 sentence", "pathBSummary": "1 sentence" },
      { "label": "Long-term Identity", "edgeWinner": "A" or "B" or "tie", "pathASummary": "1 sentence", "pathBSummary": "1 sentence" }
    ],
    "pathAStrengths": ["strength 1", "strength 2", "strength 3"],
    "pathBStrengths": ["strength 1", "strength 2", "strength 3"],
    "recommendation": "2-3 sentences: who should choose Path A vs Path B — frame it around different personality types, life stages, or current priorities"
  }
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

export async function simulateDecisionTree({ paths, nodeLabels, profile, mood, outfits }) {
  const pathText = paths.map((p, i) =>
    `Path ${i + 1}: ${p.join(' → ')}`
  ).join('\n');

  const prompt = `You are analyzing a Day Decision Tree the user has built. Each path represents a possible sequence of activities.

USER PROFILE:
- City: ${profile?.city || 'New York'}
- Age: ${profile?.age || 'unspecified'}
- Age Range: ${profile?.ageRange || 'unspecified'}
- Employment: ${profile?.employment || 'unspecified'}
- Gender Identity: ${profile?.genderIdentity || 'unspecified'}
- Appearance: ${profile?.appearance || 'unspecified'}
- Starting Mood: ${mood || 'neutral'}
- Outfit(s): ${outfits?.length ? outfits.join(', ') : 'unspecified'}
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

DECISION TREE PATHS:
${pathText}

Simulate every path, compare them, and provide actionable suggestions. Return ONLY valid JSON:

{
  "treeTitle": "A poetic 3-5 word title capturing the theme of this decision tree",
  "overallWisdom": "2-3 sentences of big-picture insight about the choices represented in this tree",
  "pathAnalyses": [
    {
      "pathIndex": 0,
      "pathLabel": "Path 1",
      "narrative": "3-4 sentences: what this sequence of choices feels like as a lived day",
      "endOfDay": "How they feel by evening on this path",
      "scores": { "energy": 0-10, "mood": 0-10, "productivity": 0-10, "social": 0-10, "overall": 0-10 },
      "identity": "1 sentence: who this path shapes them into"
    }
  ],
  "bestPathIndex": 0,
  "bestPathReason": "2-3 sentences explaining which path wins and why",
  "nodeInsights": [
    { "label": "exact activity label", "insight": "1-2 sentences specific to this activity in context", "score": 0-10 }
  ],
  "suggestions": [
    { "afterLabel": "exact activity label", "suggestedActivity": "what to do next", "emoji": "emoji", "reason": "1-2 sentences why" }
  ]
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

export async function generateRetrospective({ goals, goalOutcomes, reflection, actualEvents, profile, plannedEvents, actualMood, actualEnergy }) {
  const goalLines = goals.map(g => {
    const outcome = goalOutcomes.find(o => o.goalId === g.id);
    const status = outcome?.result || 'unknown';
    return `- [${status.toUpperCase()}] ${g.emoji} ${g.text} (type: ${g.type})`;
  }).join('\n');

  const plannedList = plannedEvents?.length
    ? plannedEvents.map(e => `  ${e.time}: ${e.label}`).join('\n')
    : 'Not recorded';

  const prompt = `You are a compassionate, insightful life coach helping someone reflect on their day.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

TODAY'S GOALS AND OUTCOMES:
${goalLines}

PLANNED EVENTS FOR TODAY:
${plannedList}

WHAT ACTUALLY HAPPENED (user's own words):
${actualEvents || 'Not provided'}

HOW THE DAY FELT (user's reflection):
${reflection || 'Not provided'}

ACTUAL END-OF-DAY MOOD: ${actualMood}/10
ACTUAL END-OF-DAY ENERGY: ${actualEnergy}/10

Provide warm, honest, non-judgmental coaching. Celebrate wins authentically. For misses, lead with compassion then offer ONE concrete, specific strategy (not generic advice). Return ONLY valid JSON:

{
  "headline": "A short, warm 4-6 word title capturing the essence of this retrospective",
  "overallScore": <integer 1-10 based on goal outcomes>,
  "wins": [
    {
      "text": "exact goal text that was achieved",
      "emoji": "🏆",
      "celebration": "2 warm sentences genuinely celebrating this win",
      "impact": "1 sentence on how this habit compounds over time"
    }
  ],
  "partials": [
    {
      "text": "exact goal text that was partial",
      "emoji": "🌱",
      "acknowledgment": "1-2 sentences acknowledging the effort and progress",
      "nextStep": "One very specific, tiny action that turns this partial into a full win tomorrow"
    }
  ],
  "misses": [
    {
      "text": "exact goal text that was missed",
      "emoji": "💡",
      "compassion": "1-2 non-judgmental sentences acknowledging the challenge",
      "rootCause": "What likely made this hard today (be specific to their profile and day)",
      "strategy": "One concrete, actionable strategy for tomorrow — specific, not generic"
    }
  ],
  "patterns": "2-3 sentences about what today's outcomes reveal about the user's current habits and where their energy naturally flows",
  "tomorrowPriority": "The single most important habit to focus on tomorrow and exactly why it will create momentum",
  "thirtyDayOutlook": "2-3 sentences painting a vivid picture of who they become if they keep improving at this rate for 30 days",
  "closingMessage": "2-3 warm, personalized, genuinely encouraging sentences to close — not generic, specific to their actual day"
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

export async function generateDailySummary({ choices, profile }) {
  const prompt = `The user completed a simulated day with these choices:
${choices.map((c, i) => `${i + 1}. ${c.time}: ${c.action}`).join('\n')}

User Profile: ${JSON.stringify(profile)}

Generate a "Who You Are Becoming" daily summary in this EXACT JSON format:
{
  "headline": "A punchy 1-sentence identity statement based on today's pattern",
  "summary": "2-3 sentences describing the kind of person these choices are shaping",
  "trend": "A poetic title for today's theme (e.g. 'The Hermit', 'The Seeker', 'The Builder')",
  "scores": {
    "energy": 0-10,
    "mood": 0-10,
    "productivity": 0-10,
    "social": 0-10,
    "overall": 0-10
  },
  "thirtyDayProjection": "2-3 sentences: if they repeat this pattern for 30 days, who do they become?",
  "oneWin": "The single most positive thing about today's choices",
  "oneRisk": "The one pattern worth watching going forward"
}

Return ONLY valid JSON.`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = extractText(response);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}
