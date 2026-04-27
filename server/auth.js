const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const TOKEN_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(
      'SELECT id, email, display_name, role FROM users WHERE id = ?'
    ).get(Number(payload.sub));
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    req.user = {
      id: Number(user.id),
      email: user.email,
      displayName: user.display_name || '',
      role: user.role || 'student'
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
    next();
  };
}

module.exports = {
  signToken,
  requireAuth,
  requireRole
};
