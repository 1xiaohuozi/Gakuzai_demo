const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

router.use(requireAuth);

router.get('/:key', (req, res) => {
  const key = String(req.params.key || '').trim();
  const row = db.prepare(
    'SELECT setting_json FROM user_settings WHERE user_id = ? AND setting_key = ?'
  ).get(req.user.id, key);

  res.json({
    key,
    value: row ? JSON.parse(row.setting_json) : null
  });
});

router.put('/:key', (req, res) => {
  const key = String(req.params.key || '').trim();
  const value = req.body.value;

  if (!key) {
    return res.status(400).json({ error: 'Setting key is required.' });
  }

  db.prepare(
    `INSERT INTO user_settings (user_id, setting_key, setting_json, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, setting_key)
     DO UPDATE SET setting_json = excluded.setting_json, updated_at = CURRENT_TIMESTAMP`
  ).run(req.user.id, key, JSON.stringify(value));

  logUserEvent(req.user.id, 'setting_update', { key });
  res.json({ key, value });
});

module.exports = router;
