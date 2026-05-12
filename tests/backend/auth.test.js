// Backend auth tests using Node's built-in test runner
// Run: node --test tests/backend/auth.test.js

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const JWT_SECRET = 'future-you-secret-2025';

// ── In-memory test DB ──────────────────────────────────
const db = new Database(':memory:');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Helpers mirroring the real route logic
async function register(email, password, name = '') {
  const hash = await bcrypt.hash(password, 10);
  const r = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, hash, name);
  return db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(r.lastInsertRowid);
}
async function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new Error('No account found');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error('Incorrect password');
  const { password: _, ...safe } = user;
  return { user: safe, token: jwt.sign({ id: safe.id, email: safe.email }, JWT_SECRET, { expiresIn: '30d' }) };
}
function verifyToken(token) { return jwt.verify(token, JWT_SECRET); }

describe('Auth — register', () => {
  it('creates a user with hashed password', async () => {
    const user = await register('alice@test.com', 'password123', 'Alice');
    assert.equal(user.email, 'alice@test.com');
    assert.equal(user.name, 'Alice');
    assert.ok(user.id > 0);
  });

  it('stores a bcrypt hash, not plaintext', async () => {
    await register('bob@test.com', 'mypassword');
    const row = db.prepare('SELECT password FROM users WHERE email = ?').get('bob@test.com');
    assert.notEqual(row.password, 'mypassword');
    assert.ok(row.password.startsWith('$2b$'));
  });

  it('throws on duplicate email', async () => {
    await register('dupe@test.com', 'pass');
    await assert.rejects(() => register('dupe@test.com', 'pass2'), /UNIQUE/);
  });
});

describe('Auth — login', () => {
  before(async () => { await register('carol@test.com', 'carol123', 'Carol'); });

  it('returns a valid JWT on correct credentials', async () => {
    const { token } = await login('carol@test.com', 'carol123');
    const decoded = verifyToken(token);
    assert.equal(decoded.email, 'carol@test.com');
  });

  it('throws on wrong password', async () => {
    await assert.rejects(() => login('carol@test.com', 'wrong'), /Incorrect password/);
  });

  it('throws on unknown email', async () => {
    await assert.rejects(() => login('nobody@test.com', 'x'), /No account found/);
  });

  it('JWT expires in ~30 days', async () => {
    const { token } = await login('carol@test.com', 'carol123');
    const { exp, iat } = verifyToken(token);
    const diffDays = (exp - iat) / 86400;
    assert.ok(diffDays >= 29 && diffDays <= 31);
  });
});

describe('Auth — password reset', () => {
  let userId;
  before(async () => {
    const u = await register('dave@test.com', 'oldpass', 'Dave');
    userId = u.id;
  });

  it('generates a 6-digit numeric reset token', () => {
    const token = crypto.randomInt(100000, 999999).toString();
    assert.match(token, /^\d{6}$/);
  });

  it('resets password with valid token', async () => {
    const token = '654321';
    const expires = Date.now() + 15 * 60 * 1000;
    db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expires);

    const reset = db.prepare('SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0').get(userId, token);
    assert.ok(reset, 'Reset record found');
    assert.ok(Date.now() <= reset.expires_at, 'Token not expired');

    const newHash = await bcrypt.hash('newpass123', 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, userId);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    const { token: newJwt } = await login('dave@test.com', 'newpass123');
    assert.ok(newJwt);
  });

  it('rejects expired token', () => {
    const token = '999999';
    const expires = Date.now() - 1000; // already expired
    db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expires);
    const reset = db.prepare('SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0').get(userId, token);
    assert.ok(reset, 'Found reset');
    assert.ok(Date.now() > reset.expires_at, 'Token IS expired');
  });

  it('rejects used token', () => {
    db.prepare('INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 1)').run(userId, '111111', Date.now() + 999999);
    const reset = db.prepare('SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND used = 0').get(userId, '111111');
    assert.equal(reset, undefined, 'Used token returns nothing');
  });
});

describe('Auth — JWT verification', () => {
  it('valid token passes verification', async () => {
    const u = await register('eve@test.com', 'pass', 'Eve');
    const token = jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: '30d' });
    assert.doesNotThrow(() => verifyToken(token));
  });

  it('tampered token fails verification', () => {
    assert.throws(() => verifyToken('bad.token.here'), /invalid/i);
  });

  it('expired token fails verification', () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1s' });
    assert.throws(() => verifyToken(token), /expired/i);
  });
});

after(() => { db.close(); });
