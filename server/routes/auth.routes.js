const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginFailures = new Map();
const registerAttempts = new Map();
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const REGISTER_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const MAX_REGISTER_ATTEMPTS = 4;

function clientKey(req, suffix = '') {
  return `${req.ip || req.socket.remoteAddress || 'unknown'}:${suffix}`;
}

function getRecord(map, key) {
  const now = Date.now();
  const record = map.get(key) || { count: 0, firstAt: now, lockedUntil: 0 };
  if (record.lockedUntil && record.lockedUntil <= now) {
    map.delete(key);
    return { count: 0, firstAt: now, lockedUntil: 0 };
  }
  return record;
}

function blockIfLocked(record, res) {
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    res.status(429).json({ error: `Too many attempts. Please try again in ${minutes} minute(s).` });
    return true;
  }
  return false;
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || '',
    role: row.role || 'student'
  };
}

router.post('/register', async (req, res) => {
  const registerKey = clientKey(req, 'register');
  const registerRecord = getRecord(registerAttempts, registerKey);
  if (Date.now() - registerRecord.firstAt > REGISTER_WINDOW_MS) {
    registerRecord.count = 0;
    registerRecord.firstAt = Date.now();
  }
  registerRecord.count += 1;
  registerAttempts.set(registerKey, registerRecord);
  if (registerRecord.count > MAX_REGISTER_ATTEMPTS) {
    registerRecord.lockedUntil = Date.now() + REGISTER_WINDOW_MS;
    return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const displayName = String(req.body.displayName || '').trim();

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
  ).run(email, passwordHash, displayName || null, 'student');

  const user = db.prepare(
    'SELECT id, email, display_name, role FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  logUserEvent(user.id, 'auth_register', { email: user.email });

  res.status(201).json({
    user: publicUser(user),
    token: signToken(user)
  });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const failureKey = clientKey(req, `login:${email}`);
  const failureRecord = getRecord(loginFailures, failureKey);
  if (blockIfLocked(failureRecord, res)) return;

  const user = db.prepare(
    'SELECT id, email, password_hash, display_name, role FROM users WHERE email = ?'
  ).get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    failureRecord.count += 1;
    if (failureRecord.count >= MAX_LOGIN_FAILURES) {
      failureRecord.lockedUntil = Date.now() + LOGIN_LOCK_MS;
    }
    loginFailures.set(failureKey, failureRecord);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  loginFailures.delete(failureKey);
  logUserEvent(user.id, 'auth_login', { email: user.email });

  res.json({
    user: publicUser(user),
    token: signToken(user)
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, display_name, role FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }

  res.json({ user: publicUser(user) });
});

module.exports = router;
