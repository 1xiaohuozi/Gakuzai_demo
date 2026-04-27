const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/summary', (req, res) => {
  const one = sql => db.prepare(sql).get();
  res.json({
    users: one('SELECT COUNT(*) AS count FROM users').count,
    courses: one('SELECT COUNT(*) AS count FROM courses').count,
    materials: one('SELECT COUNT(*) AS count FROM materials').count,
    studentWorks: one('SELECT COUNT(*) AS count FROM student_material_works').count
  });
});

module.exports = router;
