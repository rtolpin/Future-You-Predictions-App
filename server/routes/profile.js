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

export default router;
