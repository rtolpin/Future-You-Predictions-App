import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-5';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

  const text = response.content[0].text.trim();
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
- Starting Mood: ${mood || profile?.mood || 'neutral'}
- Outfit(s): ${outfits?.length ? outfits.join(', ') : 'unspecified'}
- Other details: ${JSON.stringify(profile || {})}
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

  const text = response.content[0].text.trim();
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

  const text = response.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}
