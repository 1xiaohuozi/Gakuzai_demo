const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toMaterial(row) {
  return {
    id: row.id,
    courseId: row.course_id || null,
    userId: row.user_id,
    baseLessonId: row.base_lesson_id,
    title: row.title,
    htmlContent: row.effective_html_content || row.html_content,
    originalHtmlContent: row.html_content,
    log: safeJson(row.effective_log_json || row.log_json, []),
    originalLog: safeJson(row.log_json, []),
    status: row.status || 'draft',
    displayOrder: Number(row.display_order || 0),
    hasStudentWork: !!row.work_id,
    studentWorkId: row.work_id || null,
    createdAt: row.created_at,
    updatedAt: row.effective_updated_at || row.updated_at,
    materialUpdatedAt: row.updated_at,
    workUpdatedAt: row.effective_updated_at || null
  };
}

function toWork(row) {
  return {
    id: row.id,
    materialId: row.material_id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    operationLogs: safeJson(row.operation_logs, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePayload(body) {
  return {
    courseId: Number(body.courseId || body.course_id || 0),
    title: String(body.title || '').trim(),
    baseLessonId: String(body.baseLessonId || body.base_lesson_id || '').trim(),
    htmlContent: String(body.htmlContent || body.html_content || ''),
    logJson: JSON.stringify(Array.isArray(body.log) ? body.log : []),
    status: ['draft', 'published'].includes(body.status) ? body.status : 'draft'
  };
}

function nextDisplayOrder(courseId) {
  const row = db.prepare(
    'SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM materials WHERE course_id = ?'
  ).get(courseId);
  return Number(row?.next_order || 0);
}

function normalizeCourseOrder(courseId) {
  const rows = db.prepare(
    `SELECT id FROM materials
     WHERE course_id = ?
     ORDER BY display_order ASC, created_at ASC, id ASC`
  ).all(courseId);
  rows.forEach((row, index) => {
    db.prepare('UPDATE materials SET display_order = ? WHERE id = ?').run(index, row.id);
  });
  return rows;
}

function canTeachCourse(userId, courseId) {
  const row = db.prepare(
    `SELECT c.id
     FROM courses c
     LEFT JOIN course_members cm
       ON cm.course_id = c.id AND cm.user_id = ? AND cm.role_in_course = 'teacher'
     WHERE c.id = ? AND (c.teacher_id = ? OR cm.id IS NOT NULL)`
  ).get(userId, courseId, userId);
  return !!row;
}

function studentJoinedCourse(userId, courseId) {
  return !!db.prepare(
    `SELECT id FROM course_members
     WHERE user_id = ? AND course_id = ? AND role_in_course = 'student'`
  ).get(userId, courseId);
}

function getAccessibleMaterial(user, materialId) {
  if (user.role === 'admin') {
    return db.prepare('SELECT m.* FROM materials m WHERE m.id = ?').get(materialId);
  }
  if (user.role === 'teacher') {
    return db.prepare(
      `SELECT m.*
       FROM materials m
       JOIN courses c ON c.id = m.course_id
       LEFT JOIN course_members cm
         ON cm.course_id = c.id AND cm.user_id = ? AND cm.role_in_course = 'teacher'
       WHERE m.id = ? AND (c.teacher_id = ? OR cm.id IS NOT NULL)`
    ).get(user.id, materialId, user.id);
  }
  return db.prepare(
    `SELECT m.*, w.id AS work_id, w.edited_content AS effective_html_content,
            w.operation_logs AS effective_log_json, w.updated_at AS effective_updated_at
     FROM materials m
     JOIN course_members cm ON cm.course_id = m.course_id
       AND cm.user_id = ? AND cm.role_in_course = 'student'
     LEFT JOIN student_material_works w ON w.material_id = m.id AND w.student_id = ?
     WHERE m.id = ? AND m.status = 'published'`
  ).get(user.id, user.id, materialId);
}

router.use(requireAuth);

router.get('/', (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  let rows;

  if (req.user.role === 'admin') {
    rows = db.prepare(
      `SELECT m.* FROM materials m
       WHERE (? = 0 OR m.course_id = ?)
       ORDER BY m.course_id ASC, m.display_order ASC, m.created_at ASC, m.id ASC`
    ).all(courseId, courseId);
  } else if (req.user.role === 'teacher') {
    rows = db.prepare(
      `SELECT m.*
       FROM materials m
       JOIN courses c ON c.id = m.course_id
       LEFT JOIN course_members cm
         ON cm.course_id = c.id AND cm.user_id = ? AND cm.role_in_course = 'teacher'
       WHERE (? = 0 OR m.course_id = ?)
         AND (c.teacher_id = ? OR cm.id IS NOT NULL)
       ORDER BY m.course_id ASC, m.display_order ASC, m.created_at ASC, m.id ASC`
    ).all(req.user.id, courseId, courseId, req.user.id);
  } else {
    rows = db.prepare(
      `SELECT m.*, w.id AS work_id, w.edited_content AS effective_html_content,
              w.operation_logs AS effective_log_json, w.updated_at AS effective_updated_at
       FROM materials m
       JOIN course_members cm ON cm.course_id = m.course_id
         AND cm.user_id = ? AND cm.role_in_course = 'student'
       LEFT JOIN student_material_works w ON w.material_id = m.id AND w.student_id = ?
       WHERE m.status = 'published' AND (? = 0 OR m.course_id = ?)
       ORDER BY m.course_id ASC, m.display_order ASC, m.created_at ASC, m.id ASC`
    ).all(req.user.id, req.user.id, courseId, courseId);
  }

  res.json({ materials: rows.map(toMaterial) });
});

router.get('/:id', (req, res) => {
  const row = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Material not found.' });

  logUserEvent(req.user.id, 'material_open', { materialId: row.id, title: row.title });
  res.json({ material: toMaterial(row) });
});

router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.title || !payload.baseLessonId || !payload.courseId) {
    return res.status(400).json({ error: 'courseId, title and baseLessonId are required.' });
  }
  if (req.user.role !== 'admin' && !canTeachCourse(req.user.id, payload.courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const result = db.prepare(
    `INSERT INTO materials (user_id, course_id, title, base_lesson_id, html_content, log_json, status, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, payload.courseId, payload.title, payload.baseLessonId, payload.htmlContent, payload.logJson, payload.status, nextDisplayOrder(payload.courseId));

  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
  logUserEvent(req.user.id, 'material_create', { materialId: row.id, title: row.title, courseId: row.course_id });
  res.status(201).json({ material: toMaterial(row) });
});

router.put('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const existing = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Material not found.' });

  const payload = normalizePayload({ ...req.body, courseId: req.body.courseId || existing.course_id });
  if (!payload.title || !payload.baseLessonId || !payload.courseId) {
    return res.status(400).json({ error: 'courseId, title and baseLessonId are required.' });
  }
  if (req.user.role !== 'admin' && !canTeachCourse(req.user.id, payload.courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const displayOrder = Number(payload.courseId) === Number(existing.course_id)
    ? Number(existing.display_order || 0)
    : nextDisplayOrder(payload.courseId);
  db.prepare(
    `UPDATE materials
     SET course_id = ?, title = ?, base_lesson_id = ?, html_content = ?, log_json = ?,
         status = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(payload.courseId, payload.title, payload.baseLessonId, payload.htmlContent, payload.logJson, payload.status, displayOrder, req.params.id);

  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  logUserEvent(req.user.id, 'material_update', { materialId: row.id, title: row.title });
  res.json({ material: toMaterial(row) });
});

router.patch('/:id/status', requireRole('teacher', 'admin'), (req, res) => {
  const existing = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Material not found.' });
  const status = String(req.body.status || '').trim();
  if (!['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'Status must be draft or published.' });
  }
  db.prepare(
    'UPDATE materials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, req.params.id);
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json({ material: toMaterial(row) });
});

router.patch('/:id/order', requireRole('teacher', 'admin'), (req, res) => {
  const existing = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Material not found.' });

  const direction = String(req.body.direction || '').trim();
  if (!['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'Material order direction must be up or down.' });
  }

  normalizeCourseOrder(existing.course_id);
  const current = db.prepare('SELECT * FROM materials WHERE id = ?').get(existing.id);
  const neighbor = direction === 'up'
    ? db.prepare(
      `SELECT * FROM materials
       WHERE course_id = ? AND display_order < ?
       ORDER BY display_order DESC, id DESC
       LIMIT 1`
    ).get(current.course_id, current.display_order)
    : db.prepare(
      `SELECT * FROM materials
       WHERE course_id = ? AND display_order > ?
       ORDER BY display_order ASC, id ASC
       LIMIT 1`
    ).get(current.course_id, current.display_order);

  if (neighbor) {
    db.prepare('UPDATE materials SET display_order = ? WHERE id = ?').run(neighbor.display_order, current.id);
    db.prepare('UPDATE materials SET display_order = ? WHERE id = ?').run(current.display_order, neighbor.id);
    logUserEvent(req.user.id, 'material_reorder', {
      materialId: current.id,
      courseId: current.course_id,
      direction
    });
  }

  const rows = db.prepare(
    `SELECT m.* FROM materials m
     WHERE m.course_id = ?
     ORDER BY m.display_order ASC, m.created_at ASC, m.id ASC`
  ).all(current.course_id);
  res.json({ materials: rows.map(toMaterial) });
});

router.delete('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const existing = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Material not found.' });
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  logUserEvent(req.user.id, 'material_delete', { materialId: Number(req.params.id) });
  res.status(204).end();
});

router.post('/:id/work', requireRole('student'), (req, res) => {
  const material = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!material) return res.status(404).json({ error: 'Material not found.' });

  const editedContent = String(req.body.editedContent || req.body.htmlContent || '');
  const operationLogs = JSON.stringify(Array.isArray(req.body.operationLogs || req.body.log) ? (req.body.operationLogs || req.body.log) : []);
  db.prepare(
    `INSERT INTO student_material_works (material_id, student_id, edited_content, operation_logs, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(material_id, student_id)
     DO UPDATE SET edited_content = excluded.edited_content,
                   operation_logs = excluded.operation_logs,
                   updated_at = CURRENT_TIMESTAMP`
  ).run(material.id, req.user.id, editedContent, operationLogs);

  const work = db.prepare(
    'SELECT id FROM student_material_works WHERE material_id = ? AND student_id = ?'
  ).get(material.id, req.user.id);
  if (work) {
    db.prepare(
      `UPDATE operation_events
       SET student_work_id = ?
       WHERE material_id = ? AND user_id = ? AND student_work_id IS NULL`
    ).run(work.id, material.id, req.user.id);
  }

  const row = getAccessibleMaterial(req.user, Number(req.params.id));
  logUserEvent(req.user.id, 'student_material_work_save', { materialId: material.id });
  res.json({ material: toMaterial(row) });
});

router.get('/:id/works', requireRole('teacher', 'admin'), (req, res) => {
  const material = getAccessibleMaterial(req.user, Number(req.params.id));
  if (!material) return res.status(404).json({ error: 'Material not found.' });
  const rows = db.prepare(
    `SELECT w.*, u.display_name AS student_name, u.email AS student_email
     FROM student_material_works w
     JOIN users u ON u.id = w.student_id
     WHERE w.material_id = ?
     ORDER BY w.updated_at DESC`
  ).all(material.id);
  res.json({ works: rows.map(toWork) });
});

module.exports = router;
