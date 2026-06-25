require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDb } = require('./db');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/courses.routes');
const materialRoutes = require('./routes/materials.routes');
const eventRoutes = require('./routes/events.routes');
const settingRoutes = require('./routes/settings.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const assignmentRoutes = require('./routes/assignments.routes');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicRoot = path.join(__dirname, '..');

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '25mb' }));
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 2000),
  keyGenerator: req => {
    const authorization = req.get('authorization') || '';
    if (authorization.startsWith('Bearer ')) {
      return `token:${crypto.createHash('sha256').update(authorization).digest('hex').slice(0, 24)}`;
    }
    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  },
  message: { error: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false
}));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(express.static(publicRoot, {
  extensions: ['html'],
  index: 'index.html'
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`GAKUZAI server is running at http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
