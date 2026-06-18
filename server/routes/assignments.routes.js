const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { dataDir } = require('../db');
const { requireAuth, requireRole } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

router.use(requireAuth);

const ASSIGNMENT_TYPES = new Set(['choice', 'text', 'file']);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const uploadDir = path.join(dataDir, 'assignment_uploads');
const allowedUploadTypes = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp']
]);
fs.mkdirSync(uploadDir, { recursive: true });

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function canTeachCourse(user, courseId) {
  if (user.role === 'admin') return true;
  if (!courseId || user.role !== 'teacher') return false;
  const row = db.prepare(
    `SELECT c.id
     FROM courses c
     LEFT JOIN course_members cm
       ON cm.course_id = c.id AND cm.user_id = ? AND cm.role_in_course = 'teacher'
     WHERE c.id = ? AND (c.teacher_id = ? OR cm.id IS NOT NULL)`
  ).get(user.id, courseId, user.id);
  return !!row;
}

function studentJoinedCourse(userId, courseId) {
  return !!db.prepare(
    `SELECT id FROM course_members
     WHERE user_id = ? AND course_id = ? AND role_in_course = 'student'`
  ).get(userId, courseId);
}

function getMaterialForCourse(materialId, courseId) {
  return db.prepare(
    'SELECT id, title, course_id, status FROM materials WHERE id = ? AND course_id = ?'
  ).get(materialId, courseId);
}

function getAccessibleAssignment(user, assignmentId) {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
  if (!assignment) return null;
  if (user.role === 'admin' || canTeachCourse(user, assignment.course_id)) return assignment;
  if (user.role === 'student' && assignment.status === 'published' && studentJoinedCourse(user.id, assignment.course_id)) {
    return assignment;
  }
  return null;
}

function submissionStats(assignmentId) {
  return db.prepare(
    `SELECT COUNT(*) AS submission_count,
            COALESCE(SUM(is_correct), 0) AS correct_count
     FROM assignment_submissions
     WHERE assignment_id = ?`
  ).get(assignmentId);
}

function toAssignment(row, user) {
  const choices = safeJson(row.choices_json, []);
  const out = {
    id: row.id,
    courseId: row.course_id,
    materialId: row.material_id,
    materialTitle: row.material_title || '',
    teacherId: row.teacher_id,
    title: row.title,
    assignmentType: row.assignment_type || 'choice',
    questionText: row.question_text,
    choices,
    status: row.status || 'published',
    dueAt: row.due_at || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (user.role === 'teacher' || user.role === 'admin') {
    const stats = submissionStats(row.id);
    out.correctChoiceIndex = Number(row.correct_choice_index || 0);
    out.submissionCount = Number(stats.submission_count || 0);
    out.correctCount = Number(stats.correct_count || 0);
  } else if (row.submission_id) {
    out.submission = {
      id: row.submission_id,
      choiceIndex: row.choice_index,
      isCorrect: !!row.is_correct,
      correctChoiceIndex: row.correct_choice_index,
      answer: safeJson(row.answer_json, {}),
      submittedAt: row.submitted_at,
      updatedAt: row.submission_updated_at
    };
  }
  return out;
}

function getAssignmentRow(assignmentId) {
  return db.prepare(
    `SELECT a.*, m.title AS material_title
     FROM assignments a
     JOIN materials m ON m.id = a.material_id
     WHERE a.id = ?`
  ).get(assignmentId);
}

function safeFileName(name) {
  return String(name || 'submission')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function saveSubmissionFile(file, assignmentId, studentId) {
  if (!file || typeof file !== 'object') {
    const error = new Error('Submission file is required.');
    error.status = 400;
    throw error;
  }
  const mimeType = String(file.type || '').trim();
  const ext = allowedUploadTypes.get(mimeType);
  if (!ext) {
    const error = new Error('Submission file type is invalid.');
    error.status = 400;
    throw error;
  }
  const raw = String(file.dataUrl || file.base64 || '');
  const base64 = raw.includes(',') ? raw.split(',').pop() : raw;
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    const error = new Error('Submission file is invalid.');
    error.status = 400;
    throw error;
  }
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
    const error = new Error('Submission file size is invalid.');
    error.status = 400;
    throw error;
  }
  const storedName = `${assignmentId}-${studentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const storedPath = path.join(uploadDir, storedName);
  fs.writeFileSync(storedPath, buffer);
  return {
    name: safeFileName(file.name || `submission${ext}`),
    type: mimeType,
    size: buffer.length,
    storedName,
    url: `/api/assignments/submission-files/${encodeURIComponent(storedName)}`
  };
}

function normalizeChoicePayload(body) {
  const choices = Array.isArray(body.choices)
    ? body.choices.map(choice => String(choice || '').trim()).filter(Boolean)
    : [];
  return {
    courseId: Number(body.courseId || body.course_id || 0),
    materialId: Number(body.materialId || body.material_id || 0),
    title: String(body.title || '').trim(),
    assignmentType: ASSIGNMENT_TYPES.has(String(body.assignmentType || body.assignment_type || 'choice')) ? String(body.assignmentType || body.assignment_type || 'choice') : 'choice',
    questionText: String(body.questionText || body.question_text || '').trim(),
    choices,
    correctChoiceIndex: Number(body.correctChoiceIndex ?? body.correct_choice_index ?? 0),
    status: ['draft', 'published', 'closed'].includes(body.status) ? body.status : 'published',
    dueAt: String(body.dueAt || body.due_at || '').trim()
  };
}

router.get('/', (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  const materialId = Number(req.query.materialId || 0);
  if (!courseId) return res.status(400).json({ error: 'courseId is required.' });
  if (req.user.role === 'student') {
    if (!studentJoinedCourse(req.user.id, courseId)) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
    const rows = db.prepare(
      `SELECT a.*, m.title AS material_title,
              s.id AS submission_id, s.choice_index, s.is_correct, s.answer_json,
              s.submitted_at, s.updated_at AS submission_updated_at
       FROM assignments a
       JOIN materials m ON m.id = a.material_id
       LEFT JOIN assignment_submissions s
         ON s.assignment_id = a.id AND s.student_id = ?
       WHERE a.course_id = ? AND a.status = 'published'
         AND (? = 0 OR a.material_id = ?)
       ORDER BY a.updated_at DESC, a.id DESC`
    ).all(req.user.id, courseId, materialId, materialId);
    return res.json({ assignments: rows.map(row => toAssignment(row, req.user)) });
  }

  if (!canTeachCourse(req.user, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  const rows = db.prepare(
    `SELECT a.*, m.title AS material_title
     FROM assignments a
     JOIN materials m ON m.id = a.material_id
     WHERE a.course_id = ? AND (? = 0 OR a.material_id = ?)
     ORDER BY a.updated_at DESC, a.id DESC`
  ).all(courseId, materialId, materialId);
  res.json({ assignments: rows.map(row => toAssignment(row, req.user)) });
});

router.post('/', requireRole('teacher', 'admin'), (req, res) => {
  const payload = normalizeChoicePayload(req.body);
  if (!payload.courseId || !payload.materialId || !payload.title || !payload.questionText) {
    return res.status(400).json({ error: 'courseId, materialId, title and questionText are required.' });
  }
  if (payload.assignmentType === 'choice' && payload.choices.length < 2) {
    return res.status(400).json({ error: 'At least two choices are required.' });
  }
  if (payload.assignmentType === 'choice' && (payload.correctChoiceIndex < 0 || payload.correctChoiceIndex >= payload.choices.length)) {
    return res.status(400).json({ error: 'Correct choice index is invalid.' });
  }
  if (!canTeachCourse(req.user, payload.courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  const material = getMaterialForCourse(payload.materialId, payload.courseId);
  if (!material) return res.status(400).json({ error: 'Material does not belong to the selected course.' });

  const result = db.prepare(
    `INSERT INTO assignments (
       course_id, material_id, teacher_id, title, assignment_type,
       question_text, choices_json, correct_choice_index, status, due_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    payload.courseId,
    payload.materialId,
    req.user.id,
    payload.title,
    payload.assignmentType,
    payload.questionText,
    JSON.stringify(payload.assignmentType === 'choice' ? payload.choices : []),
    payload.assignmentType === 'choice' ? payload.correctChoiceIndex : 0,
    payload.status,
    payload.dueAt || null
  );

  const row = db.prepare(
    `SELECT a.*, m.title AS material_title
     FROM assignments a
     JOIN materials m ON m.id = a.material_id
     WHERE a.id = ?`
  ).get(result.lastInsertRowid);
  logUserEvent(req.user.id, 'assignment_create', { assignmentId: row.id, courseId: row.course_id, materialId: row.material_id });
  res.status(201).json({ assignment: toAssignment(row, req.user) });
});

function updateAssignment(req, res) {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const payload = normalizeChoicePayload(req.body);
  if (!payload.courseId || !payload.materialId || !payload.title || !payload.questionText) {
    return res.status(400).json({ error: 'courseId, materialId, title and questionText are required.' });
  }
  if (payload.assignmentType === 'choice' && payload.choices.length < 2) {
    return res.status(400).json({ error: 'At least two choices are required.' });
  }
  if (payload.assignmentType === 'choice' && (payload.correctChoiceIndex < 0 || payload.correctChoiceIndex >= payload.choices.length)) {
    return res.status(400).json({ error: 'Correct choice index is invalid.' });
  }
  if (!canTeachCourse(req.user, payload.courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  const material = getMaterialForCourse(payload.materialId, payload.courseId);
  if (!material) return res.status(400).json({ error: 'Material does not belong to the selected course.' });

  db.prepare(
    `UPDATE assignments
        SET course_id = ?,
            material_id = ?,
            title = ?,
            assignment_type = ?,
            question_text = ?,
            choices_json = ?,
            correct_choice_index = ?,
            status = ?,
            due_at = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).run(
    payload.courseId,
    payload.materialId,
    payload.title,
    payload.assignmentType,
    payload.questionText,
    JSON.stringify(payload.assignmentType === 'choice' ? payload.choices : []),
    payload.assignmentType === 'choice' ? payload.correctChoiceIndex : 0,
    payload.status,
    payload.dueAt || null,
    assignment.id
  );

  const row = getAssignmentRow(assignment.id);
  logUserEvent(req.user.id, 'assignment_update', { assignmentId: row.id, courseId: row.course_id, materialId: row.material_id });
  res.json({ assignment: toAssignment(row, req.user) });
}

router.put('/:id', requireRole('teacher', 'admin'), updateAssignment);
router.patch('/:id', requireRole('teacher', 'admin'), updateAssignment);

router.delete('/:id', requireRole('teacher', 'admin'), (req, res) => {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  db.prepare('DELETE FROM assignments WHERE id = ?').run(assignment.id);
  logUserEvent(req.user.id, 'assignment_delete', { assignmentId: assignment.id, courseId: assignment.course_id, materialId: assignment.material_id });
  res.json({ ok: true });
});

router.get('/submission-files/:name', (req, res) => {
  const storedName = path.basename(String(req.params.name || ''));
  if (!storedName) return res.status(404).json({ error: 'File not found.' });
  const filePath = path.join(uploadDir, storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  res.sendFile(filePath);
});

router.patch('/:id/status', requireRole('teacher', 'admin'), (req, res) => {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const status = String(req.body.status || '').trim();
  if (!['draft', 'published', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Assignment status is invalid.' });
  }
  db.prepare('UPDATE assignments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, assignment.id);
  const row = db.prepare(
    `SELECT a.*, m.title AS material_title
     FROM assignments a
     JOIN materials m ON m.id = a.material_id
     WHERE a.id = ?`
  ).get(assignment.id);
  res.json({ assignment: toAssignment(row, req.user) });
});

router.post('/:id/submissions', requireRole('student'), (req, res) => {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  if (assignment.status !== 'published') {
    return res.status(400).json({ error: 'Assignment is not accepting submissions.' });
  }
  const assignmentType = assignment.assignment_type || 'choice';
  const choices = safeJson(assignment.choices_json, []);
  let choiceIndex = null;
  let isCorrect = 0;
  let answer = { type: assignmentType };
  if (assignmentType === 'choice') {
    choiceIndex = Number(req.body.choiceIndex ?? req.body.choice_index);
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= choices.length) {
      return res.status(400).json({ error: 'Choice index is invalid.' });
    }
    isCorrect = choiceIndex === Number(assignment.correct_choice_index) ? 1 : 0;
    answer = { type: 'choice', choiceIndex, choiceText: choices[choiceIndex] || '' };
  } else if (assignmentType === 'text') {
    const text = String(req.body.textAnswer ?? req.body.text_answer ?? '').trim();
    if (!text) return res.status(400).json({ error: 'Text answer is required.' });
    answer = { type: 'text', text };
  } else if (assignmentType === 'file') {
    try {
      answer = { type: 'file', file: saveSubmissionFile(req.body.file, assignment.id, req.user.id) };
    } catch (error) {
      return res.status(error.status || 400).json({ error: error.message || 'Submission file is invalid.' });
    }
  }
  db.prepare(
    `INSERT INTO assignment_submissions (
       assignment_id, student_id, answer_json, choice_index, is_correct, updated_at
     )
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(assignment_id, student_id)
     DO UPDATE SET answer_json = excluded.answer_json,
                   choice_index = excluded.choice_index,
                   is_correct = excluded.is_correct,
                   updated_at = CURRENT_TIMESTAMP`
  ).run(
    assignment.id,
    req.user.id,
    JSON.stringify(answer),
    choiceIndex,
    isCorrect
  );

  const submission = db.prepare(
    `SELECT id, choice_index, is_correct, submitted_at, updated_at
     FROM assignment_submissions
     WHERE assignment_id = ? AND student_id = ?`
  ).get(assignment.id, req.user.id);
  logUserEvent(req.user.id, 'assignment_submit', { assignmentId: assignment.id, assignmentType, choiceIndex, isCorrect: !!isCorrect });
  res.status(201).json({
    submission: {
      id: submission.id,
      choiceIndex: submission.choice_index,
      isCorrect: !!submission.is_correct,
      correctChoiceIndex: assignment.correct_choice_index,
      submittedAt: submission.submitted_at,
      updatedAt: submission.updated_at
    }
  });
});

router.patch('/:id/submissions/:submissionId/review', requireRole('teacher', 'admin'), (req, res) => {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const submission = db.prepare(
    `SELECT * FROM assignment_submissions
     WHERE id = ? AND assignment_id = ?`
  ).get(Number(req.params.submissionId), assignment.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found.' });
  const answer = safeJson(submission.answer_json, {});
  const status = ['pending', 'reviewed', 'needs_revision'].includes(String(req.body.reviewStatus || ''))
    ? String(req.body.reviewStatus)
    : 'reviewed';
  answer.review = {
    status,
    feedback: String(req.body.feedback || '').trim().slice(0, 2000),
    reviewedBy: req.user.id,
    reviewedAt: new Date().toISOString()
  };
  db.prepare(
    `UPDATE assignment_submissions
        SET answer_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).run(JSON.stringify(answer), submission.id);
  logUserEvent(req.user.id, 'assignment_review', { assignmentId: assignment.id, submissionId: submission.id, status });
  res.json({
    submission: {
      id: submission.id,
      assignmentId: assignment.id,
      studentId: submission.student_id,
      choiceIndex: submission.choice_index,
      isCorrect: !!submission.is_correct,
      answer,
      submittedAt: submission.submitted_at,
      updatedAt: new Date().toISOString()
    }
  });
});

router.get('/:id/submissions', requireRole('teacher', 'admin'), (req, res) => {
  const assignment = getAccessibleAssignment(req.user, Number(req.params.id));
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const rows = db.prepare(
    `SELECT s.*, u.display_name AS student_name, u.email AS student_email
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = ?
     ORDER BY s.updated_at DESC`
  ).all(assignment.id);
  const participants = db.prepare(
    `SELECT u.id AS student_id,
            u.display_name AS student_name,
            u.email AS student_email,
            s.id AS submission_id,
            s.choice_index,
            s.is_correct,
            s.answer_json,
            s.submitted_at,
            s.updated_at
     FROM course_members cm
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN assignment_submissions s
       ON s.assignment_id = ? AND s.student_id = u.id
     WHERE cm.course_id = ? AND cm.role_in_course = 'student'
     ORDER BY COALESCE(s.updated_at, ''), u.display_name, u.email`
  ).all(assignment.id, assignment.course_id);
  res.json({
    submissions: rows.map(row => ({
      id: row.id,
      assignmentId: row.assignment_id,
      studentId: row.student_id,
      studentName: row.student_name || '',
      studentEmail: row.student_email || '',
      choiceIndex: row.choice_index,
      isCorrect: !!row.is_correct,
      answer: safeJson(row.answer_json, {}),
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at
    })),
    participants: participants.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name || '',
      studentEmail: row.student_email || '',
      submitted: !!row.submission_id,
      choiceIndex: row.choice_index,
      isCorrect: !!row.is_correct,
      answer: safeJson(row.answer_json, {}),
      submittedAt: row.submitted_at || '',
      updatedAt: row.updated_at || ''
    }))
  });
});

module.exports = router;
