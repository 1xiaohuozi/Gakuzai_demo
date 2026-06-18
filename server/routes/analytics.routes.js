const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.use(requireAuth);

function safeJsonString(value, fallback = {}) {
  try {
    return JSON.stringify(value && typeof value === 'object' ? value : fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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

function getStudentWorkId(materialId, studentId) {
  const row = db.prepare(
    `SELECT id FROM student_material_works
     WHERE material_id = ? AND student_id = ?`
  ).get(materialId, studentId);
  return row ? row.id : null;
}

function getPublishedStudentMaterial(userId, materialId) {
  return db.prepare(
    `SELECT m.*
     FROM materials m
     JOIN course_members cm ON cm.course_id = m.course_id
       AND cm.user_id = ? AND cm.role_in_course = 'student'
     WHERE m.id = ? AND m.status = 'published'`
  ).get(userId, materialId);
}

function buildAnalyticsScope(user, { courseId = 0, materialId = 0 } = {}) {
  const joins = [
    'LEFT JOIN courses c ON c.id = oe.course_id',
    'LEFT JOIN materials m ON m.id = oe.material_id'
  ];
  const params = [];
  const conditions = [];

  if (user.role !== 'admin') {
    joins.push(
      `LEFT JOIN course_members scope_cm
       ON scope_cm.course_id = c.id
      AND scope_cm.user_id = ?
      AND scope_cm.role_in_course = 'teacher'`
    );
    params.push(user.id);
    conditions.push('(c.teacher_id = ? OR scope_cm.id IS NOT NULL)');
    params.push(user.id);
  }
  if (courseId) {
    conditions.push('oe.course_id = ?');
    params.push(courseId);
  }
  if (materialId) {
    conditions.push('oe.material_id = ?');
    params.push(materialId);
  }

  return {
    joins: joins.join('\n'),
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

function actionFamily(actionType) {
  if (actionType === 'keyword') return 'keyword';
  if (actionType === 'popup') return 'popup';
  if (actionType === 'marker') return 'marker';
  if (actionType === 'color') return 'color';
  if (actionType === 'emphasis' || actionType === 'font-size') return 'emphasis';
  if (actionType === 'clear-style') return 'revision';
  if (String(actionType || '').startsWith('image-')) return 'image';
  return 'other';
}

function erpProcess(actionType) {
  if (actionType === 'keyword') return 'reduction';
  if (['marker', 'color', 'emphasis', 'font-size'].includes(actionType)) return 'formatting';
  if (actionType === 'popup') return 'annotation';
  if (actionType === 'clear-style') return 'revision';
  if (String(actionType || '').startsWith('image-')) return 'layout';
  return 'other';
}

function charCount(text) {
  return Array.from(String(text || '').replace(/\s+/g, '')).length;
}

function getKeywordReplacement(params) {
  const keyword = String(params?.keyword || params?.keywordText || '▽').trim();
  return keyword || '▽';
}

function pct(part, total) {
  return total ? Math.round((Number(part || 0) / Number(total || 1)) * 100) : 0;
}

function nullableString(value) {
  return value == null || value === '' ? null : String(value);
}

function nullableNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function topEntries(map, limit = 8) {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildLegacyAnalyticsScope(user, { courseId = 0, materialId = 0 } = {}) {
  const joins = [
    'JOIN materials m ON m.id = w.material_id',
    'LEFT JOIN courses c ON c.id = m.course_id'
  ];
  const params = [];
  const conditions = [];

  if (user.role !== 'admin') {
    joins.push(
      `LEFT JOIN course_members scope_cm
       ON scope_cm.course_id = c.id
      AND scope_cm.user_id = ?
      AND scope_cm.role_in_course = 'teacher'`
    );
    params.push(user.id);
    conditions.push('(c.teacher_id = ? OR scope_cm.id IS NOT NULL)');
    params.push(user.id);
  }
  if (courseId) {
    conditions.push('m.course_id = ?');
    params.push(courseId);
  }
  if (materialId) {
    conditions.push('m.id = ?');
    params.push(materialId);
  }

  return {
    joins: joins.join('\n'),
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

function operationWorkKey(materialId, studentId) {
  return `${Number(materialId || 0)}:${Number(studentId || 0)}`;
}

function getCurrentWorkOperationIndex(user, { courseId = 0, materialId = 0 } = {}) {
  const scope = buildLegacyAnalyticsScope(user, { courseId, materialId });
  const rows = db.prepare(
    `SELECT w.material_id AS materialId,
            w.student_id AS studentId,
            w.operation_logs AS operationLogs
     FROM student_material_works w
     ${scope.joins}
     ${scope.where}`
  ).all(...scope.params);

  const index = new Map();
  for (const row of rows) {
    const logs = safeJson(row.operationLogs, []);
    const ids = new Set();
    if (Array.isArray(logs)) {
      for (const log of logs) {
        if (log?.clientEventId) ids.add(String(log.clientEventId));
      }
    }
    index.set(operationWorkKey(row.materialId, row.studentId), ids);
  }
  return index;
}

function filterCurrentOperationRows(rows, currentIndex, fields = {}) {
  const materialField = fields.materialField || 'materialId';
  const studentField = fields.studentField || 'studentId';
  const eventField = fields.eventField || 'clientEventId';
  return rows.filter(row => {
    const key = operationWorkKey(row[materialField], row[studentField]);
    if (!currentIndex.has(key)) return true;
    const activeIds = currentIndex.get(key);
    const eventId = row[eventField] == null ? '' : String(row[eventField]);
    return !!eventId && activeIds.has(eventId);
  });
}

router.post('/operation-events', requireRole('student'), (req, res) => {
  const materialId = Number(req.body.materialId || req.body.material_id || 0);
  const actionType = String(req.body.actionType || req.body.action_type || '').trim();
  if (!materialId || !actionType) {
    return res.status(400).json({ error: 'materialId and actionType are required.' });
  }

  const material = getPublishedStudentMaterial(req.user.id, materialId);
  if (!material) return res.status(404).json({ error: 'Material not found.' });

  const selection = req.body.selection && typeof req.body.selection === 'object'
    ? req.body.selection
    : {};
  const device = req.body.device && typeof req.body.device === 'object'
    ? req.body.device
    : {};
  const research = req.body.research && typeof req.body.research === 'object'
    ? req.body.research
    : {};
  const clientEventId = String(req.body.clientEventId || req.body.client_event_id || '').trim() || null;

  const result = db.prepare(
    `INSERT OR IGNORE INTO operation_events (
       client_event_id, user_id, course_id, material_id, student_work_id,
       base_lesson_id, action_type, action_params_json, selected_text,
       selected_html, block_id, block_text, operation_index, material_version_id,
       block_order, block_hash, selected_text_hash, before_text, after_text,
       before_html, after_html, replacement_text, normalized_replacement,
       previous_event_id, time_since_previous_ms, is_repeated_block_edit,
       start_offset, end_offset, client_time, session_id, device_json
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    clientEventId,
    req.user.id,
    material.course_id || null,
    material.id,
    getStudentWorkId(material.id, req.user.id),
    String(req.body.baseLessonId || material.base_lesson_id || ''),
    actionType,
    safeJsonString(req.body.actionParams || req.body.action_params, {}),
    selection.text == null ? null : String(selection.text),
    selection.html == null ? null : String(selection.html),
    selection.blockId == null ? null : String(selection.blockId),
    selection.blockText == null ? null : String(selection.blockText),
    nullableNumber(research.operationIndex ?? req.body.operationIndex),
    nullableString(research.materialVersionId ?? req.body.materialVersionId),
    nullableNumber(research.blockOrder ?? selection.blockOrder),
    nullableString(research.blockHash ?? selection.blockHash),
    nullableString(research.selectedTextHash ?? selection.selectedTextHash),
    nullableString(research.beforeText ?? selection.beforeText),
    nullableString(research.afterText ?? selection.afterText),
    nullableString(research.beforeHtml ?? selection.beforeHtml),
    nullableString(research.afterHtml ?? selection.afterHtml),
    nullableString(research.replacementText ?? req.body.replacementText),
    nullableString(research.normalizedReplacement ?? req.body.normalizedReplacement),
    nullableString(research.previousEventId ?? req.body.previousEventId),
    nullableNumber(research.timeSincePreviousMs ?? req.body.timeSincePreviousMs),
    research.isRepeatedBlockEdit || req.body.isRepeatedBlockEdit ? 1 : 0,
    nullableNumber(selection.startOffset),
    nullableNumber(selection.endOffset),
    req.body.clientTime ? String(req.body.clientTime) : null,
    req.body.sessionId ? String(req.body.sessionId) : null,
    safeJsonString(device, {})
  );

  res.status(result.changes ? 201 : 200).json({ ok: true });
});

router.get('/summary', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  const materialId = Number(req.query.materialId || 0);
  if (courseId && !canTeachCourse(req.user, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  if (materialId) {
    const material = db.prepare('SELECT course_id FROM materials WHERE id = ?').get(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found.' });
    if (!canTeachCourse(req.user, material.course_id)) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
  }

  const scope = buildAnalyticsScope(req.user, { courseId, materialId });
  const currentIndex = getCurrentWorkOperationIndex(req.user, { courseId, materialId });
  const eventRows = filterCurrentOperationRows(db.prepare(
    `SELECT oe.user_id AS studentId,
            u.display_name AS studentName,
            u.email AS studentEmail,
            oe.material_id AS materialId,
            m.title AS materialTitle,
            oe.block_id AS blockId,
            oe.action_type AS actionType,
            oe.client_event_id AS clientEventId,
            oe.session_id AS sessionId,
            oe.created_at AS createdAt
     FROM operation_events oe
     JOIN users u ON u.id = oe.user_id
     ${scope.joins}
     ${scope.where}
     ORDER BY oe.user_id ASC, oe.session_id ASC, oe.created_at ASC, oe.id ASC`
  ).all(...scope.params), currentIndex);

  const seenClientEvents = new Set(eventRows.map(row => row.clientEventId).filter(Boolean));
  const legacyScope = buildLegacyAnalyticsScope(req.user, { courseId, materialId });
  const legacyWorks = db.prepare(
    `SELECT w.*, u.display_name AS studentName, u.email AS studentEmail,
            m.title AS materialTitle, m.course_id AS courseId
     FROM student_material_works w
     JOIN users u ON u.id = w.student_id
     ${legacyScope.joins}
     ${legacyScope.where}
     ORDER BY w.student_id ASC, w.updated_at ASC`
  ).all(...legacyScope.params);
  const legacyRows = [];
  for (const work of legacyWorks) {
    const logs = safeJson(work.operation_logs, []);
    if (!Array.isArray(logs)) continue;
    for (let index = 0; index < logs.length; index += 1) {
      const log = logs[index] || {};
      if (!log.action) continue;
      if (log.clientEventId && seenClientEvents.has(log.clientEventId)) continue;
      legacyRows.push({
        studentId: work.student_id,
        studentName: work.studentName || '',
        studentEmail: work.studentEmail || '',
        materialId: work.material_id,
        materialTitle: work.materialTitle || '',
        blockId: log.selection?.blockId || '',
        actionType: log.action,
        clientEventId: log.clientEventId || `legacy-${work.id}-${index}`,
        sessionId: `legacy-work-${work.id}`,
        createdAt: log.time || work.updated_at
      });
    }
  }
  const rows = [...eventRows, ...legacyRows].sort((a, b) => {
    const user = Number(a.studentId || 0) - Number(b.studentId || 0);
    if (user) return user;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });

  const actionMap = new Map();
  const actionStudents = new Map();
  const materialMap = new Map();
  const materialStudents = new Map();
  const blockMap = new Map();
  const blockStudents = new Map();
  const sessions = new Set();
  const students = new Set();
  const materials = new Set();

  const studentMap = new Map();
  const sequenceMap = new Map();
  const transitionMap = new Map();
  let currentSession = null;
  let currentActions = [];

  function flushSession() {
    if (!currentSession || !currentActions.length) return;
    const condensed = currentActions.filter((action, index) => action !== currentActions[index - 1]);
    const pattern = condensed.slice(0, 5).join(' -> ');
    if (pattern) sequenceMap.set(pattern, (sequenceMap.get(pattern) || 0) + 1);
    for (let i = 1; i < condensed.length; i += 1) {
      const key = `${condensed[i - 1]} -> ${condensed[i]}`;
      transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
    }
  }

  for (const row of rows) {
    students.add(row.studentId);
    if (row.materialId) materials.add(row.materialId);
    if (row.sessionId) sessions.add(row.sessionId);
    actionMap.set(row.actionType, (actionMap.get(row.actionType) || 0) + 1);
    if (!actionStudents.has(row.actionType)) actionStudents.set(row.actionType, new Set());
    actionStudents.get(row.actionType).add(row.studentId);
    const materialKey = String(row.materialId || '');
    if (materialKey) {
      const current = materialMap.get(materialKey) || {
        materialId: row.materialId,
        materialTitle: row.materialTitle || '',
        count: 0,
        lastAt: row.createdAt
      };
      current.count += 1;
      current.lastAt = row.createdAt || current.lastAt;
      materialMap.set(materialKey, current);
      if (!materialStudents.has(materialKey)) materialStudents.set(materialKey, new Set());
      materialStudents.get(materialKey).add(row.studentId);
    }
    const blockKey = `${row.materialId || ''}:${row.blockId || ''}`;
    if (row.blockId || row.materialId) {
      const current = blockMap.get(blockKey) || {
        materialId: row.materialId,
        materialTitle: row.materialTitle || '',
        blockId: row.blockId || '',
        count: 0
      };
      current.count += 1;
      blockMap.set(blockKey, current);
      if (!blockStudents.has(blockKey)) blockStudents.set(blockKey, new Set());
      blockStudents.get(blockKey).add(row.studentId);
    }

    const student = studentMap.get(row.studentId) || {
      studentId: row.studentId,
      studentName: row.studentName || '',
      studentEmail: row.studentEmail || '',
      totalActions: 0,
      families: {},
      actions: {},
      firstAt: row.createdAt,
      lastAt: row.createdAt
    };
    student.totalActions += 1;
    student.lastAt = row.createdAt;
    student.firstAt = student.firstAt || row.createdAt;
    student.actions[row.actionType] = (student.actions[row.actionType] || 0) + 1;
    const family = actionFamily(row.actionType);
    student.families[family] = (student.families[family] || 0) + 1;
    studentMap.set(row.studentId, student);

    const sessionKey = `${row.studentId}:${row.sessionId || 'no-session'}`;
    if (currentSession !== sessionKey) {
      flushSession();
      currentSession = sessionKey;
      currentActions = [];
    }
    currentActions.push(family);
  }
  flushSession();

  const byStudent = Array.from(studentMap.values()).map(student => {
    const actionEntries = Object.entries(student.actions).sort((a, b) => b[1] - a[1]);
    const familyEntries = Object.entries(student.families).sort((a, b) => b[1] - a[1]);
    return {
      ...student,
      uniqueActions: actionEntries.length,
      dominantAction: actionEntries[0]?.[0] || '',
      dominantFamily: familyEntries[0]?.[0] || ''
    };
  }).sort((a, b) => b.totalActions - a.totalActions);
  const byAction = Array.from(actionMap.entries()).map(([actionType, count]) => ({
    actionType,
    count,
    students: actionStudents.get(actionType)?.size || 0
  })).sort((a, b) => b.count - a.count);
  const byMaterial = Array.from(materialMap.entries()).map(([key, value]) => ({
    ...value,
    students: materialStudents.get(key)?.size || 0
  })).sort((a, b) => b.count - a.count);
  const byBlock = Array.from(blockMap.entries()).map(([key, value]) => ({
    ...value,
    students: blockStudents.get(key)?.size || 0
  })).sort((a, b) => b.count - a.count).slice(0, 20);
  const totals = {
    operations: rows.length,
    students: students.size,
    materials: materials.size,
    sessions: sessions.size
  };

  res.json({
    totals,
    byAction,
    byMaterial,
    byBlock,
    byStudent,
    sequences: topEntries(sequenceMap),
    transitions: topEntries(transitionMap)
  });
});

router.get('/insights', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  const materialId = Number(req.query.materialId || 0);
  const studentId = Number(req.query.studentId || 0);
  const actionTypeFilter = String(req.query.actionType || '').trim();

  if (!courseId) return res.status(400).json({ error: 'courseId is required.' });
  if (!canTeachCourse(req.user, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  if (materialId) {
    const material = db.prepare('SELECT course_id FROM materials WHERE id = ?').get(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found.' });
    if (Number(material.course_id) !== courseId) {
      return res.status(400).json({ error: 'Material does not belong to the selected course.' });
    }
  }

  const enrolled = db.prepare(
    `SELECT u.id AS studentId, u.display_name AS studentName, u.email AS studentEmail
     FROM course_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.course_id = ? AND cm.role_in_course = 'student'
     ORDER BY u.display_name ASC, u.email ASC`
  ).all(courseId);
  const materials = db.prepare(
    `SELECT id, title, status
     FROM materials
     WHERE course_id = ? AND (? = 0 OR id = ?)
     ORDER BY display_order ASC, created_at ASC, id ASC`
  ).all(courseId, materialId, materialId);
  const works = db.prepare(
    `SELECT w.material_id AS materialId, w.student_id AS studentId, w.updated_at AS updatedAt
     FROM student_material_works w
     JOIN materials m ON m.id = w.material_id
     WHERE m.course_id = ? AND (? = 0 OR m.id = ?)`
  ).all(courseId, materialId, materialId);

  const conditions = ['oe.course_id = ?'];
  const params = [courseId];
  if (materialId) { conditions.push('oe.material_id = ?'); params.push(materialId); }
  if (studentId) { conditions.push('oe.user_id = ?'); params.push(studentId); }
  if (actionTypeFilter) { conditions.push('oe.action_type = ?'); params.push(actionTypeFilter); }
  const currentIndex = getCurrentWorkOperationIndex(req.user, { courseId, materialId });
  const rows = filterCurrentOperationRows(db.prepare(
    `SELECT oe.id,
            oe.client_event_id AS clientEventId,
            oe.user_id AS studentId,
            u.display_name AS studentName,
            u.email AS studentEmail,
            oe.material_id AS materialId,
            m.title AS materialTitle,
            oe.action_type AS actionType,
            oe.action_params_json AS actionParamsJson,
            oe.selected_text AS selectedText,
            oe.block_id AS blockId,
            oe.block_text AS blockText,
            COALESCE(oe.client_time, oe.created_at) AS eventTime
     FROM operation_events oe
     JOIN users u ON u.id = oe.user_id
     LEFT JOIN materials m ON m.id = oe.material_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY oe.user_id ASC, oe.material_id ASC, COALESCE(oe.client_time, oe.created_at) ASC, oe.id ASC`
  ).all(...params), currentIndex);

  const materialMap = new Map(materials.map(material => [Number(material.id), {
    materialId: material.id,
    materialTitle: material.title || '',
    status: material.status || 'draft',
    actionCount: 0,
    startedStudents: new Set(),
    savedStudents: new Set(),
    reductionStudents: new Set(),
    formattingOnlyStudents: 0,
    reductionActions: 0,
    formattingActions: 0,
    annotationActions: 0,
    revisionActions: 0,
    layoutActions: 0,
    hiddenChars: 0,
    originalChars: 0,
    replacementChars: 0,
    repeatedReductionEdits: 0,
    replacementReviewCount: 0
  }]));
  const studentMap = new Map(enrolled.map(student => [Number(student.studentId), {
    studentId: student.studentId,
    studentName: student.studentName || '',
    studentEmail: student.studentEmail || '',
    actionCount: 0,
    materialsStarted: new Set(),
    materialsSaved: new Set(),
    blocksEdited: new Set(),
    actionTypes: new Set(),
    reductionActions: 0,
    formattingActions: 0,
    annotationActions: 0,
    revisionActions: 0,
    layoutActions: 0,
    hiddenChars: 0,
    originalChars: 0,
    replacementChars: 0,
    repeatedReductionEdits: 0,
    replacementReviewCount: 0,
    firstAt: '',
    lastAt: ''
  }]));
  const blockMap = new Map();
  const reductionSeen = new Map();
  const materialStudentProcess = new Map();
  const replacements = [];

  for (const work of works) {
    materialMap.get(Number(work.materialId))?.savedStudents.add(Number(work.studentId));
    studentMap.get(Number(work.studentId))?.materialsSaved.add(Number(work.materialId));
  }

  for (const row of rows) {
    const process = erpProcess(row.actionType);
    const paramsJson = safeJson(row.actionParamsJson, {});
    const student = studentMap.get(Number(row.studentId)) || {
      studentId: row.studentId,
      studentName: row.studentName || '',
      studentEmail: row.studentEmail || '',
      actionCount: 0,
      materialsStarted: new Set(),
      materialsSaved: new Set(),
      blocksEdited: new Set(),
      actionTypes: new Set(),
      reductionActions: 0,
      formattingActions: 0,
      annotationActions: 0,
      revisionActions: 0,
      layoutActions: 0,
      hiddenChars: 0,
      originalChars: 0,
      replacementChars: 0,
      repeatedReductionEdits: 0,
      replacementReviewCount: 0,
      firstAt: '',
      lastAt: ''
    };
    student.actionCount += 1;
    student.materialsStarted.add(Number(row.materialId));
    student.blocksEdited.add(`${row.materialId}:${row.blockId || 'unknown'}`);
    student.actionTypes.add(row.actionType);
    student.firstAt = student.firstAt || row.eventTime;
    student.lastAt = row.eventTime || student.lastAt;

    const material = materialMap.get(Number(row.materialId));
    if (material) {
      material.actionCount += 1;
      material.startedStudents.add(Number(row.studentId));
    }
    const msKey = `${row.materialId}:${row.studentId}`;
    const ms = materialStudentProcess.get(msKey) || { reduction: 0, formatting: 0 };

    if (process === 'reduction') {
      const originalChars = charCount(row.selectedText);
      const replacement = getKeywordReplacement(paramsJson);
      const replacementChars = charCount(replacement === '▽' ? '' : replacement);
      const hiddenChars = Math.max(0, originalChars - replacementChars);
      const reductionKey = `${row.materialId}:${row.studentId}:${row.blockId || 'unknown'}`;
      const seenCount = reductionSeen.get(reductionKey) || 0;
      reductionSeen.set(reductionKey, seenCount + 1);
      const repeated = seenCount > 0 ? 1 : 0;
      const needsReview = replacement !== '▽' && replacementChars > 0;

      student.reductionActions += 1;
      student.originalChars += originalChars;
      student.replacementChars += replacementChars;
      student.hiddenChars += hiddenChars;
      student.repeatedReductionEdits += repeated;
      student.replacementReviewCount += needsReview ? 1 : 0;
      ms.reduction += 1;

      if (material) {
        material.reductionActions += 1;
        material.reductionStudents.add(Number(row.studentId));
        material.originalChars += originalChars;
        material.replacementChars += replacementChars;
        material.hiddenChars += hiddenChars;
        material.repeatedReductionEdits += repeated;
        material.replacementReviewCount += needsReview ? 1 : 0;
      }

      if (needsReview) {
        replacements.push({
          studentId: row.studentId,
          studentName: row.studentName || row.studentEmail || '',
          materialId: row.materialId,
          materialTitle: row.materialTitle || '',
          blockId: row.blockId || '',
          originalText: String(row.selectedText || '').slice(0, 160),
          replacement,
          originalChars,
          replacementChars,
          eventTime: row.eventTime
        });
      }
    } else if (process === 'formatting') {
      student.formattingActions += 1;
      ms.formatting += 1;
      if (material) material.formattingActions += 1;
    } else if (process === 'annotation') {
      student.annotationActions += 1;
      if (material) material.annotationActions += 1;
    } else if (process === 'revision') {
      student.revisionActions += 1;
      if (material) material.revisionActions += 1;
    } else if (process === 'layout') {
      student.layoutActions += 1;
      if (material) material.layoutActions += 1;
    }
    materialStudentProcess.set(msKey, ms);

    const blockKey = `${row.materialId}:${row.blockId || 'unknown'}`;
    const block = blockMap.get(blockKey) || {
      materialId: row.materialId,
      materialTitle: row.materialTitle || '',
      blockId: row.blockId || 'unknown',
      blockText: row.blockText || '',
      students: new Set(),
      actionCount: 0,
      reductionActions: 0,
      formattingActions: 0,
      hiddenChars: 0,
      originalChars: 0,
      replacementChars: 0,
      repeatedReductionEdits: 0,
      replacementReviewCount: 0
    };
    block.actionCount += 1;
    block.students.add(Number(row.studentId));
    if (!block.blockText && row.blockText) block.blockText = row.blockText;
    if (process === 'reduction') {
      const originalChars = charCount(row.selectedText);
      const replacement = getKeywordReplacement(paramsJson);
      const replacementChars = charCount(replacement === '▽' ? '' : replacement);
      block.reductionActions += 1;
      block.originalChars += originalChars;
      block.replacementChars += replacementChars;
      block.hiddenChars += Math.max(0, originalChars - replacementChars);
      block.replacementReviewCount += replacement !== '▽' && replacementChars > 0 ? 1 : 0;
    }
    if (process === 'formatting') block.formattingActions += 1;
    blockMap.set(blockKey, block);

    studentMap.set(Number(row.studentId), student);
  }

  for (const [key, value] of materialStudentProcess.entries()) {
    const [mid] = key.split(':').map(Number);
    if (!value.reduction && value.formatting) {
      const material = materialMap.get(mid);
      if (material) material.formattingOnlyStudents += 1;
    }
  }

  const students = Array.from(studentMap.values()).map(student => {
    let strategyLabel = '未参加';
    const attentionReasons = [];
    if (student.actionCount > 0 && student.reductionActions === 0 && student.formattingActions > 0) strategyLabel = '装飾のみ';
    if (student.reductionActions > 0) strategyLabel = student.repeatedReductionEdits > 0 ? '試行錯誤型縮約' : '本文縮約実施';
    if (student.actionCount > 0 && student.reductionActions === 0 && student.formattingActions === 0) strategyLabel = '低情報操作';
    if (!student.actionCount) attentionReasons.push('未参加');
    if (student.actionCount > 0 && student.reductionActions === 0 && student.formattingActions > 0) attentionReasons.push('装飾のみで本文縮約なし');
    if (student.reductionActions > 0 && student.repeatedReductionEdits === 0) attentionReasons.push('本文縮約は単発中心');
    if (student.replacementReviewCount > 0) attentionReasons.push('置換語の確認候補あり');
    const { materialsStarted, materialsSaved, blocksEdited, actionTypes, ...studentData } = student;
    return {
      ...studentData,
      materialsStarted: materialsStarted.size,
      materialsSaved: materialsSaved.size,
      editedBlocks: blocksEdited.size,
      toolDiversity: actionTypes.size,
      reductionRate: student.originalChars ? Number((student.replacementChars / student.originalChars).toFixed(2)) : null,
      strategyLabel,
      attentionReasons,
      needsAttention: attentionReasons.length > 0
    };
  }).sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || b.actionCount - a.actionCount);

  const materialSummaries = Array.from(materialMap.values()).map(material => ({
    ...material,
    startedStudents: material.startedStudents.size,
    savedStudents: material.savedStudents.size,
    reductionStudents: material.reductionStudents.size,
    participationRate: pct(material.startedStudents.size, enrolled.length),
    saveRate: pct(material.savedStudents.size, enrolled.length),
    reductionRate: material.originalChars ? Number((material.replacementChars / material.originalChars).toFixed(2)) : null,
    attentionCount: material.formattingOnlyStudents + Math.max(0, enrolled.length - material.startedStudents.size) + material.replacementReviewCount
  })).sort((a, b) => b.attentionCount - a.attentionCount || b.actionCount - a.actionCount);

  const blocks = Array.from(blockMap.values()).map(block => ({
    ...block,
    students: block.students.size,
    reductionRate: block.originalChars ? Number((block.replacementChars / block.originalChars).toFixed(2)) : null
  })).sort((a, b) => b.reductionActions - a.reductionActions || b.actionCount - a.actionCount);

  const startedSet = new Set(rows.map(row => Number(row.studentId)));
  const savedSet = new Set(works.map(work => Number(work.studentId)));
  const reductionSet = new Set(rows.filter(row => erpProcess(row.actionType) === 'reduction').map(row => Number(row.studentId)));
  const formattingOnlyStudents = students.filter(student => student.actionCount > 0 && student.reductionActions === 0 && student.formattingActions > 0);
  const attentionQueue = [];
  for (const student of students) {
    for (const reason of student.attentionReasons.slice(0, 2)) {
      attentionQueue.push({
        type: reason.includes('未参加') ? 'not-started' : reason.includes('装飾') ? 'formatting-only' : reason.includes('置換') ? 'replacement-review' : 'reduction-process',
        severity: reason.includes('未参加') || reason.includes('装飾') ? 'high' : 'medium',
        studentId: student.studentId,
        studentName: student.studentName || student.studentEmail || `学生 ${student.studentId}`,
        message: reason
      });
    }
  }

  const totals = {
    enrolledStudents: enrolled.length,
    startedStudents: startedSet.size,
    savedStudents: savedSet.size,
    reductionStudents: reductionSet.size,
    formattingOnlyStudents: formattingOnlyStudents.length,
    actionCount: rows.length,
    participationRate: pct(startedSet.size, enrolled.length),
    saveRate: pct(savedSet.size, enrolled.length),
    reductionParticipationRate: pct(reductionSet.size, enrolled.length),
    attentionCount: attentionQueue.length
  };

  const processTotals = materialSummaries.reduce((acc, material) => {
    acc.reductionActions += material.reductionActions;
    acc.formattingActions += material.formattingActions;
    acc.annotationActions += material.annotationActions;
    acc.revisionActions += material.revisionActions;
    acc.layoutActions += material.layoutActions;
    acc.hiddenChars += material.hiddenChars;
    acc.originalChars += material.originalChars;
    acc.replacementChars += material.replacementChars;
    acc.repeatedReductionEdits += material.repeatedReductionEdits;
    acc.replacementReviewCount += material.replacementReviewCount;
    return acc;
  }, {
    reductionActions: 0,
    formattingActions: 0,
    annotationActions: 0,
    revisionActions: 0,
    layoutActions: 0,
    hiddenChars: 0,
    originalChars: 0,
    replacementChars: 0,
    repeatedReductionEdits: 0,
    replacementReviewCount: 0
  });
  processTotals.reductionRate = processTotals.originalChars
    ? Number((processTotals.replacementChars / processTotals.originalChars).toFixed(2))
    : null;

  res.json({
    filters: { courseId, materialId, studentId, actionType: actionTypeFilter },
    totals,
    processTotals,
    materials: materialSummaries,
    students,
    blocks,
    replacements: replacements.slice(0, 80),
    attentionQueue: attentionQueue.slice(0, 40)
  });
});

router.get('/details', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  const materialId = Number(req.query.materialId || 0);
  const studentId = Number(req.query.studentId || 0);
  const actionTypeFilter = String(req.query.actionType || '').trim();
  if (courseId && !canTeachCourse(req.user, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }
  if (materialId) {
    const material = db.prepare('SELECT course_id FROM materials WHERE id = ?').get(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found.' });
    if (!canTeachCourse(req.user, material.course_id)) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
  }

  const scope = buildAnalyticsScope(req.user, { courseId, materialId });
  const detailConditions = [];
  const detailParams = [...scope.params];
  if (studentId) {
    detailConditions.push('oe.user_id = ?');
    detailParams.push(studentId);
  }
  if (actionTypeFilter) {
    detailConditions.push('oe.action_type = ?');
    detailParams.push(actionTypeFilter);
  }
  const detailWhere = [scope.where ? scope.where.replace(/^WHERE\s+/i, '') : '', ...detailConditions].filter(Boolean);
  const currentIndex = getCurrentWorkOperationIndex(req.user, { courseId, materialId });
  const rows = filterCurrentOperationRows(db.prepare(
    `SELECT oe.id,
            oe.client_event_id AS clientEventId,
            oe.user_id AS studentId,
            u.display_name AS studentName,
            u.email AS studentEmail,
            oe.material_id AS materialId,
            m.title AS materialTitle,
            oe.action_type AS actionType,
            oe.action_params_json AS actionParamsJson,
            oe.selected_text AS selectedText,
            oe.selected_html AS selectedHtml,
            oe.block_id AS blockId,
            oe.block_text AS blockText,
            oe.operation_index AS operationIndex,
            oe.material_version_id AS materialVersionId,
            oe.block_order AS blockOrder,
            oe.block_hash AS blockHash,
            oe.selected_text_hash AS selectedTextHash,
            oe.before_text AS beforeText,
            oe.after_text AS afterText,
            oe.before_html AS beforeHtml,
            oe.after_html AS afterHtml,
            oe.replacement_text AS replacementText,
            oe.normalized_replacement AS normalizedReplacement,
            oe.previous_event_id AS previousEventId,
            oe.time_since_previous_ms AS timeSincePreviousMs,
            oe.is_repeated_block_edit AS isRepeatedBlockEdit,
            oe.start_offset AS startOffset,
            oe.end_offset AS endOffset,
            oe.client_time AS clientTime,
            oe.created_at AS createdAt
     FROM operation_events oe
     JOIN users u ON u.id = oe.user_id
     ${scope.joins}
     ${detailWhere.length ? `WHERE ${detailWhere.join(' AND ')}` : ''}
     ORDER BY oe.user_id ASC, COALESCE(oe.client_time, oe.created_at) ASC, oe.id ASC`
  ).all(...detailParams), currentIndex);

  const blockMap = new Map();
  const studentMap = new Map();
  const events = rows.map(row => {
    const params = safeJson(row.actionParamsJson, {});
    const event = {
      id: row.id,
      studentId: row.studentId,
      studentName: row.studentName || '',
      studentEmail: row.studentEmail || '',
      materialId: row.materialId,
      materialTitle: row.materialTitle || '',
      actionType: row.actionType,
      actionFamily: actionFamily(row.actionType),
      actionParams: params && typeof params === 'object' ? params : {},
      selectedText: row.selectedText || '',
      selectedHtml: row.selectedHtml || '',
      blockId: row.blockId || '',
      blockText: row.blockText || '',
      operationIndex: row.operationIndex,
      materialVersionId: row.materialVersionId || '',
      blockOrder: row.blockOrder,
      blockHash: row.blockHash || '',
      selectedTextHash: row.selectedTextHash || '',
      beforeText: row.beforeText || '',
      afterText: row.afterText || '',
      beforeHtml: row.beforeHtml || '',
      afterHtml: row.afterHtml || '',
      replacementText: row.replacementText || '',
      normalizedReplacement: row.normalizedReplacement || '',
      previousEventId: row.previousEventId || '',
      timeSincePreviousMs: row.timeSincePreviousMs,
      isRepeatedBlockEdit: !!row.isRepeatedBlockEdit,
      startOffset: row.startOffset,
      endOffset: row.endOffset,
      clientTime: row.clientTime || '',
      createdAt: row.createdAt
    };

    const blockKey = `${event.materialId || ''}:${event.blockId || 'unknown'}`;
    const block = blockMap.get(blockKey) || {
      materialId: event.materialId,
      materialTitle: event.materialTitle,
      blockId: event.blockId || 'unknown',
      blockText: event.blockText || '',
      count: 0,
      students: new Set(),
      actions: {}
    };
    block.count += 1;
    if (!block.blockText && event.blockText) block.blockText = event.blockText;
    block.students.add(event.studentId);
    block.actions[event.actionType] = (block.actions[event.actionType] || 0) + 1;
    blockMap.set(blockKey, block);

    const student = studentMap.get(event.studentId) || {
      studentId: event.studentId,
      studentName: event.studentName,
      studentEmail: event.studentEmail,
      count: 0,
      firstAt: event.clientTime || event.createdAt,
      lastAt: event.clientTime || event.createdAt,
      actions: {}
    };
    student.count += 1;
    student.lastAt = event.clientTime || event.createdAt || student.lastAt;
    student.actions[event.actionType] = (student.actions[event.actionType] || 0) + 1;
    studentMap.set(event.studentId, student);

    return event;
  });

  const blocks = Array.from(blockMap.values()).map(block => ({
    ...block,
    students: block.students.size
  })).sort((a, b) => b.count - a.count);
  const students = Array.from(studentMap.values()).sort((a, b) => b.count - a.count);

  res.json({ blocks, students, events });
});

router.get('/operations.csv', requireRole('teacher', 'admin'), (req, res) => {
  const courseId = Number(req.query.courseId || 0);
  const materialId = Number(req.query.materialId || 0);
  if (courseId && !canTeachCourse(req.user, courseId)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const conditions = [];
  const params = [];
  if (req.user.role !== 'admin') {
    conditions.push('(c.teacher_id = ? OR cm.id IS NOT NULL)');
    params.push(req.user.id);
  }
  if (courseId) {
    conditions.push('oe.course_id = ?');
    params.push(courseId);
  }
  if (materialId) {
    conditions.push('oe.material_id = ?');
    params.push(materialId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const currentIndex = getCurrentWorkOperationIndex(req.user, { courseId, materialId });
  const rows = filterCurrentOperationRows(db.prepare(
    `SELECT oe.*, u.email AS student_email, u.display_name AS student_name,
            c.name AS course_name, m.title AS material_title
     FROM operation_events oe
     JOIN users u ON u.id = oe.user_id
     LEFT JOIN courses c ON c.id = oe.course_id
     LEFT JOIN materials m ON m.id = oe.material_id
     LEFT JOIN course_members cm
       ON cm.course_id = c.id AND cm.user_id = ? AND cm.role_in_course = 'teacher'
     ${where}
     ORDER BY oe.created_at ASC`
  ).all(req.user.id, ...params), currentIndex, {
    materialField: 'material_id',
    studentField: 'user_id',
    eventField: 'client_event_id'
  });
  const seenClientEvents = new Set(rows.map(row => row.client_event_id).filter(Boolean));

  const legacyScope = buildLegacyAnalyticsScope(req.user, { courseId, materialId });
  const legacyRows = db.prepare(
    `SELECT w.*, u.email AS student_email, u.display_name AS student_name,
            c.name AS course_name, m.title AS material_title,
            m.course_id AS course_id, m.base_lesson_id AS base_lesson_id
     FROM student_material_works w
     JOIN users u ON u.id = w.student_id
     ${legacyScope.joins}
     ${legacyScope.where}
     ORDER BY w.updated_at ASC`
  ).all(...legacyScope.params);
  for (const work of legacyRows) {
    const logs = safeJson(work.operation_logs, []);
    if (!Array.isArray(logs)) continue;
    for (let index = 0; index < logs.length; index += 1) {
      const log = logs[index] || {};
      if (!log.action) continue;
      if (log.clientEventId && seenClientEvents.has(log.clientEventId)) continue;
      rows.push({
        id: `legacy-${work.id}-${index}`,
        created_at: log.time || work.updated_at,
        client_time: log.time || '',
        session_id: `legacy-work-${work.id}`,
        user_id: work.student_id,
        student_email: work.student_email,
        student_name: work.student_name,
        course_id: work.course_id,
        course_name: work.course_name,
        material_id: work.material_id,
        material_title: work.material_title,
        base_lesson_id: work.base_lesson_id,
        block_id: log.selection?.blockId || '',
        operation_index: '',
        material_version_id: '',
        block_order: '',
        block_hash: log.selection?.blockHash || '',
        selected_text_hash: log.selection?.selectedTextHash || '',
        before_text: log.selection?.beforeText || '',
        after_text: log.selection?.afterText || '',
        before_html: log.selection?.beforeHtml || '',
        after_html: log.selection?.afterHtml || '',
        replacement_text: log.keyword || log.text || '',
        normalized_replacement: '',
        previous_event_id: '',
        time_since_previous_ms: '',
        is_repeated_block_edit: '',
        start_offset: log.selection?.startOffset ?? '',
        end_offset: log.selection?.endOffset ?? '',
        action_type: log.action,
        action_params_json: safeJsonString(log, {}),
        selected_text: log.selection?.text || '',
        selected_html: log.selection?.html || '',
        block_text: log.selection?.blockText || '',
        device_json: '{}'
      });
    }
  }
  rows.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));

  const headers = [
    'id', 'server_time', 'client_time', 'session_id', 'student_id',
    'student_email', 'student_name', 'course_id', 'course_name',
    'material_id', 'material_title', 'base_lesson_id', 'block_id',
    'operation_index', 'material_version_id', 'block_order', 'block_hash',
    'selected_text_hash', 'before_text', 'after_text', 'before_html',
    'after_html', 'replacement_text', 'normalized_replacement',
    'previous_event_id', 'time_since_previous_ms', 'is_repeated_block_edit',
    'start_offset', 'end_offset', 'action_type', 'action_params_json',
    'selected_text', 'selected_html', 'block_text', 'device_json'
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.id,
      row.created_at,
      row.client_time,
      row.session_id,
      row.user_id,
      row.student_email,
      row.student_name,
      row.course_id,
      row.course_name,
      row.material_id,
      row.material_title,
      row.base_lesson_id,
      row.block_id,
      row.operation_index,
      row.material_version_id,
      row.block_order,
      row.block_hash,
      row.selected_text_hash,
      row.before_text,
      row.after_text,
      row.before_html,
      row.after_html,
      row.replacement_text,
      row.normalized_replacement,
      row.previous_event_id,
      row.time_since_previous_ms,
      row.is_repeated_block_edit,
      row.start_offset,
      row.end_offset,
      row.action_type,
      row.action_params_json,
      row.selected_text,
      row.selected_html,
      row.block_text,
      row.device_json
    ].map(csvCell).join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="gakuzai-operation-events.csv"');
  res.send(`\uFEFF${lines.join('\r\n')}`);
});

module.exports = router;
