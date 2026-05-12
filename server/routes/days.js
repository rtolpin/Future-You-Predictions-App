import { Router } from 'express';
import db from '../services/db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/days — list all saved days for user
router.get('/', (req, res) => {
  const days = db.prepare(`
    SELECT id, title, date, mood, outfits, notes, created_at,
           json_array_length(events) as event_count
    FROM saved_days WHERE user_id = ? ORDER BY date DESC, created_at DESC
  `).all(req.user.id);
  res.json({ days });
});

// GET /api/days/:id — get full day with events + predictions
router.get('/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM saved_days WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  res.json({
    ...day,
    events: JSON.parse(day.events || '[]'),
    predictions: JSON.parse(day.predictions || '{}'),
    outfits: JSON.parse(day.outfits || '[]'),
    profile: JSON.parse(day.profile || '{}'),
  });
});

// POST /api/days — save a day
router.post('/', (req, res) => {
  const { title, date, events, predictions, mood, outfits, profile, notes } = req.body;
  if (!events || !date) return res.status(400).json({ error: 'date and events required' });
  const result = db.prepare(`
    INSERT INTO saved_days (user_id, title, date, events, predictions, mood, outfits, profile, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title || `Day — ${date}`,
    date,
    JSON.stringify(events),
    JSON.stringify(predictions || {}),
    mood || null,
    JSON.stringify(outfits || []),
    JSON.stringify(profile || {}),
    notes || null
  );
  const saved = db.prepare('SELECT * FROM saved_days WHERE id = ?').get(result.lastInsertRowid);
  res.json({ day: { ...saved, events, predictions, outfits, profile } });
});

// PATCH /api/days/:id — update title/notes
router.patch('/:id', (req, res) => {
  const { title, notes } = req.body;
  db.prepare('UPDATE saved_days SET title = ?, notes = ? WHERE id = ? AND user_id = ?')
    .run(title, notes, req.params.id, req.user.id);
  res.json({ ok: true });
});

// DELETE /api/days/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM saved_days WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
