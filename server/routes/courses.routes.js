const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

router.use(requireAuth);

function toCourse(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    teacherId: row.teacher_id,
    teacherName: row.teacher_name || '',
    semester: row.semester || '',
    inviteCode: row.invite_code,
    roleInCourse: row.role_in_course || '',
    memberCount: row.member_count || 0,
    materialCount: row.material_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function generateInviteCode() {
  for (let i = 0; i < 12; i += 1) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const exists = db.prepare('SELECT id FROM courses WHERE invite_code = ?').get(code);
    if (!exists) return code;
  }
  throw new Error('Could not generate unique invite code.');
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

router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare(
      `SELECT c.*, u.display_name AS teacher_name,
              '' AS role_in_course,
              (SELECT COUNT(*) FROM course_members cm WHERE cm.course_id = c.id) AS member_count,
              (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id) AS material_count
       FROM courses c
       LEFT JOIN users u ON u.id = c.teacher_id
       ORDER BY c.updated_at DESC`
    ).all();
  } else if (req.user.role === 'teacher') {
    rows = db.prepare(
      `SELECT c.*, u.display_name AS teacher_name,
              COALESCE(cm.role_in_course, CASE WHEN c.teacher_id = ? THEN 'teacher' ELSE '' END) AS role_in_course,
              (SELECT COUNT(*) FROM course_members m WHERE m.course_id = c.id) AS member_count,
              (SELECT COUNT(*) FROM materials mat WHERE mat.course_id = c.id) AS material_count
       FROM courses c
       LEFT JOIN users u ON u.id = c.teacher_id
       LEFT JOIN course_members cm ON cm.course_id = c.id AND cm.user_id = ?
       WHERE c.teacher_id = ? OR cm.role_in_course = 'teacher'
       ORDER BY c.updated_at DESC`
    ).all(req.user.id, req.user.id, req.user.id);
  } else {
    rows = db.prepare(
      `SELECT c.*, u.display_name AS teacher_name, cm.role_in_course,
              (SELECT COUNT(*) FROM course_members m WHERE m.course_id = c.id) AS member_count,
              (SELECT COUNT(*) FROM materials mat WHERE mat.course_id = c.id AND mat.status = 'published') AS material_count
       FROM course_members cm
       JOIN courses c ON c.id = cm.course_id
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE cm.user_id = ? AND cm.role_in_course = 'student'
       ORDER BY cm.joined_at DESC`
    ).all(req.user.id);
  }

  res.json({ courses: rows.map(toCourse) });
});

router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const semester = String(req.body.semester || '').trim();
  const teacherId = req.user.role === 'admin' && req.body.teacherId
    ? Number(req.body.teacherId)
    : req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Course name is required.' });
  }

  const teacher = db.prepare("SELECT id FROM users WHERE id = ? AND role IN ('teacher', 'admin')").get(teacherId);
  if (!teacher) {
    return res.status(400).json({ error: 'Valid teacher is required.' });
  }

  const inviteCode = generateInviteCode();
  const result = db.prepare(
    `INSERT INTO courses (name, description, teacher_id, semester, invite_code)
     VALUES (?, ?, ?, ?, ?)`
  ).run(name, description || null, teacherId, semester || null, inviteCode);

  db.prepare(
    `INSERT OR IGNORE INTO course_members (course_id, user_id, role_in_course)
     VALUES (?, ?, 'teacher')`
  ).run(result.lastInsertRowid, teacherId);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  logUserEvent(req.user.id, 'course_create', { courseId: course.id, name: course.name });
  res.status(201).json({ course: toCourse(course) });
});

router.post('/join', requireRole('student'), (req, res) => {
  const inviteCode = String(req.body.inviteCode || '').trim().toUpperCase();
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code is required.' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE invite_code = ?').get(inviteCode);
  if (!course) {
    return res.status(404).json({ error: 'Course not found for this code.' });
  }

  const result = db.prepare(
    `INSERT OR IGNORE INTO course_members (course_id, user_id, role_in_course)
     VALUES (?, ?, 'student')`
  ).run(course.id, req.user.id);

  if (!result.changes) {
    return res.status(409).json({ error: 'You have already joined this course.' });
  }

  logUserEvent(req.user.id, 'course_join', { courseId: course.id });
  res.status(201).json({ course: toCourse({ ...course, role_in_course: 'student' }) });
});

router.put('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.params.id);
  if (req.user.role !== 'admin' && !canTeachCourse(req.user.id, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const semester = String(req.body.semester || '').trim();
  if (!name) return res.status(400).json({ error: 'Course name is required.' });

  const result = db.prepare(
    `UPDATE courses
     SET name = ?, description = ?, semester = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(name, description || null, semester || null, courseId);
  if (!result.changes) return res.status(404).json({ error: 'Course not found.' });

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  res.json({ course: toCourse(course) });
});

router.delete('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.params.id);
  if (req.user.role !== 'admin' && !canTeachCourse(req.user.id, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
  if (!result.changes) return res.status(404).json({ error: 'Course not found.' });
  res.status(204).end();
});

module.exports = router;
