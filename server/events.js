const db = require('./db');

function logUserEvent(userId, eventType, metadata = {}) {
  db.prepare(
    'INSERT INTO user_events (user_id, event_type, metadata_json) VALUES (?, ?, ?)'
  ).run(userId || null, eventType, JSON.stringify(metadata || {}));
}

module.exports = {
  logUserEvent
};
