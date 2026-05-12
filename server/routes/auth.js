import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../services/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'future-you-secret-2025';
const JWT_EXPIRES = '30d';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
    const result = stmt.run(email.toLowerCase().trim(), hash, name || '');
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ user, token: makeToken(user) });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'An account with this email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'No account found with that email' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });
  const { password: _, ...safe } = user;
  res.json({ user: safe, token: makeToken(safe) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'No account found with that email' });

  // Generate 6-digit code
  const token = crypto.randomInt(100000, 999999).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires);

  // In production this would be emailed. For now, return it directly.
  res.json({ message: 'Reset code generated', resetCode: token, note: 'In production this would be sent to your email.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) return res.status(400).json({ error: 'Email, code, and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'No account found with that email' });

  const reset = db.prepare('SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0').get(user.id, token);
  if (!reset) return res.status(400).json({ error: 'Invalid reset code' });
  if (Date.now() > reset.expires_at) return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

  const updatedUser = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(user.id);
  res.json({ user: updatedUser, token: makeToken(updatedUser) });
});

export default router;
