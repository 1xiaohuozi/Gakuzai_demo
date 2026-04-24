const express = require('express');
const { requireAuth } = require('../auth');
const { logUserEvent } = require('../events');

const router = express.Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  const eventType = String(req.body.eventType || '').trim();
  const metadata = req.body.metadata && typeof req.body.metadata === 'object'
    ? req.body.metadata
    : {};

  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required.' });
  }

  logUserEvent(req.user.id, eventType, metadata);
  res.status(201).json({ ok: true });
});

module.exports = router;
