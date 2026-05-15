import express from 'express';
import db from '../services/db.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// GET /api/profile — return the signed-in user's saved profile
router.get('/', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT profile FROM users WHERE id = ?').get(req.user.id);
    const profile = row?.profile ? JSON.parse(row.profile) : null;
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/profile — save or update the signed-in user's profile
router.put('/', requireAuth, (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'Profile data required' });
    db.prepare('UPDATE users SET profile = ? WHERE id = ?').run(JSON.stringify(profile), req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// GET /api/profile/goals — return the signed-in user's saved goals
router.get('/goals', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT goals FROM users WHERE id = ?').get(req.user.id);
    const goals = row?.goals ? JSON.parse(row.goals) : null;
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load goals' });
  }
});

// PUT /api/profile/goals — save or update the signed-in user's goals
router.put('/goals', requireAuth, (req, res) => {
  try {
    const { goals } = req.body;
    if (!goals) return res.status(400).json({ error: 'Goals data required' });
    db.prepare('UPDATE users SET goals = ? WHERE id = ?').run(JSON.stringify(goals), req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save goals' });
  }
});

export default router;
