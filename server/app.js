require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDb } = require('./db');

const authRoutes = require('./routes/auth.routes');
const materialRoutes = require('./routes/materials.routes');
const eventRoutes = require('./routes/events.routes');
const settingRoutes = require('./routes/settings.routes');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicRoot = path.join(__dirname, '..');

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/settings', settingRoutes);

app.use(express.static(publicRoot, {
  extensions: ['html'],
  index: 'index.html'
}));

app.use((err, req, res, next) => {
  console.error(err);
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
