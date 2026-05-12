// Backend saved-days tests
// Run: node --test tests/backend/days.test.js

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

const db = new Database(':memory:');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT
  );
  CREATE TABLE saved_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    date TEXT NOT NULL,
    events TEXT NOT NULL,
    predictions TEXT,
    mood TEXT,
    outfits TEXT,
    profile TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

let userId;
before(() => {
  const r = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('test@test.com', 'hash');
  userId = r.lastInsertRowid;
});

function saveDay(overrides = {}) {
  const defaults = {
    userId,
    title: 'Test Day',
    date: '2025-06-01',
    events: JSON.stringify([{ id: 'e1', card: { label: 'Run' }, startMinutes: 480, durationMinutes: 60 }]),
    predictions: JSON.stringify({}),
    mood: 'happy',
    outfits: JSON.stringify(['Athletic Wear']),
    profile: JSON.stringify({ name: 'Alice' }),
    notes: 'Good day',
  };
  const d = { ...defaults, ...overrides };
  const r = db.prepare('INSERT INTO saved_days (user_id,title,date,events,predictions,mood,outfits,profile,notes) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(d.userId, d.title, d.date, d.events, d.predictions, d.mood, d.outfits, d.profile, d.notes);
  return r.lastInsertRowid;
}

describe('saved_days — create', () => {
  it('saves a day with all fields', () => {
    const id = saveDay();
    const row = db.prepare('SELECT * FROM saved_days WHERE id = ?').get(id);
    assert.equal(row.title, 'Test Day');
    assert.equal(row.date, '2025-06-01');
    assert.equal(row.mood, 'happy');
    const events = JSON.parse(row.events);
    assert.equal(events[0].card.label, 'Run');
  });

  it('saves multiple days for one user', () => {
    saveDay({ date: '2025-06-02' });
    saveDay({ date: '2025-06-03' });
    const rows = db.prepare('SELECT * FROM saved_days WHERE user_id = ?').all(userId);
    assert.ok(rows.length >= 3);
  });
});

describe('saved_days — read', () => {
  let dayId;
  before(() => { dayId = saveDay({ title: 'My Read Day', date: '2025-07-01' }); });

  it('retrieves a day by id', () => {
    const row = db.prepare('SELECT * FROM saved_days WHERE id = ?').get(dayId);
    assert.equal(row.title, 'My Read Day');
  });

  it('returns correct user_id', () => {
    const row = db.prepare('SELECT * FROM saved_days WHERE id = ?').get(dayId);
    assert.equal(row.user_id, userId);
  });

  it('returns null for non-existent id', () => {
    const row = db.prepare('SELECT * FROM saved_days WHERE id = ?').get(999999);
    assert.equal(row, undefined);
  });

  it('lists days in descending date order', () => {
    const rows = db.prepare('SELECT date FROM saved_days WHERE user_id = ? ORDER BY date DESC').all(userId);
    for (let i = 0; i < rows.length - 1; i++) {
      assert.ok(rows[i].date >= rows[i+1].date);
    }
  });
});

describe('saved_days — update', () => {
  let dayId;
  before(() => { dayId = saveDay({ title: 'Original', date: '2025-08-01' }); });

  it('updates title and notes', () => {
    db.prepare('UPDATE saved_days SET title = ?, notes = ? WHERE id = ?').run('Updated Title', 'New notes', dayId);
    const row = db.prepare('SELECT title, notes FROM saved_days WHERE id = ?').get(dayId);
    assert.equal(row.title, 'Updated Title');
    assert.equal(row.notes, 'New notes');
  });
});

describe('saved_days — delete', () => {
  it('deletes a specific day', () => {
    const id = saveDay({ date: '2025-09-01' });
    db.prepare('DELETE FROM saved_days WHERE id = ? AND user_id = ?').run(id, userId);
    const row = db.prepare('SELECT id FROM saved_days WHERE id = ?').get(id);
    assert.equal(row, undefined);
  });

  it('cascades delete when user is deleted', () => {
    const r = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('temp@t.com', 'h');
    const uid = r.lastInsertRowid;
    saveDay({ userId: uid, date: '2025-10-01' });
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    const rows = db.prepare('SELECT * FROM saved_days WHERE user_id = ?').all(uid);
    assert.equal(rows.length, 0);
  });

  it('cannot delete another user\'s day', () => {
    const id = saveDay({ date: '2025-11-01' });
    db.prepare('DELETE FROM saved_days WHERE id = ? AND user_id = ?').run(id, 9999); // wrong user
    const row = db.prepare('SELECT id FROM saved_days WHERE id = ?').get(id);
    assert.ok(row, 'Day still exists');
  });
});

after(() => { db.close(); });
