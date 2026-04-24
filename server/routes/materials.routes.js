const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

function toMaterial(row) {
  return {
    id: row.id,
    baseLessonId: row.base_lesson_id,
    title: row.title,
    htmlContent: row.html_content,
    log: safeJson(row.log_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizePayload(body) {
  return {
    title: String(body.title || '').trim(),
    baseLessonId: String(body.baseLessonId || '').trim(),
    htmlContent: String(body.htmlContent || ''),
    logJson: JSON.stringify(Array.isArray(body.log) ? body.log : [])
  };
}

router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(
    `SELECT id, base_lesson_id, title, html_content, log_json, created_at, updated_at
     FROM materials
     WHERE user_id = ?
     ORDER BY updated_at DESC`
  ).all(req.user.id);

  res.json({ materials: rows.map(toMaterial) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(
    `SELECT id, base_lesson_id, title, html_content, log_json, created_at, updated_at
     FROM materials
     WHERE id = ? AND user_id = ?`
  ).get(req.params.id, req.user.id);

  if (!row) {
    return res.status(404).json({ error: 'Material not found.' });
  }

  logUserEvent(req.user.id, 'material_open', { materialId: row.id, title: row.title });
  res.json({ material: toMaterial(row) });
});

router.post('/', (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.title || !payload.baseLessonId) {
    return res.status(400).json({ error: 'Title and baseLessonId are required.' });
  }

  const result = db.prepare(
    `INSERT INTO materials (user_id, title, base_lesson_id, html_content, log_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(req.user.id, payload.title, payload.baseLessonId, payload.htmlContent, payload.logJson);

  const row = db.prepare(
    `SELECT id, base_lesson_id, title, html_content, log_json, created_at, updated_at
     FROM materials
     WHERE id = ? AND user_id = ?`
  ).get(result.lastInsertRowid, req.user.id);

  logUserEvent(req.user.id, 'material_create', { materialId: row.id, title: row.title });
  res.status(201).json({ material: toMaterial(row) });
});

router.put('/:id', (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.title || !payload.baseLessonId) {
    return res.status(400).json({ error: 'Title and baseLessonId are required.' });
  }

  const result = db.prepare(
    `UPDATE materials
     SET title = ?, base_lesson_id = ?, html_content = ?, log_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`
  ).run(payload.title, payload.baseLessonId, payload.htmlContent, payload.logJson, req.params.id, req.user.id);

  if (!result.changes) {
    return res.status(404).json({ error: 'Material not found.' });
  }

  const row = db.prepare(
    `SELECT id, base_lesson_id, title, html_content, log_json, created_at, updated_at
     FROM materials
     WHERE id = ? AND user_id = ?`
  ).get(req.params.id, req.user.id);

  logUserEvent(req.user.id, 'material_update', { materialId: row.id, title: row.title });
  res.json({ material: toMaterial(row) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM materials WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);

  if (!result.changes) {
    return res.status(404).json({ error: 'Material not found.' });
  }

  logUserEvent(req.user.id, 'material_delete', { materialId: Number(req.params.id) });
  res.status(204).end();
});

module.exports = router;
