const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const workspaceDataDir = path.join(__dirname, 'data');
const defaultDataDir = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'GakuzaiDemo')
  : workspaceDataDir;
const dataDir = process.env.GAKUZAI_DATA_DIR || defaultDataDir;
const dbPath = process.env.GAKUZAI_DB_PATH || path.join(dataDir, 'gakuzai.sqlite');
const legacyDbPath = path.join(workspaceDataDir, 'gakuzai.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
  fs.copyFileSync(legacyDbPath, dbPath);
}

let db;

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized.');
  }
  return db;
}

function getParams(args) {
  return args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
}

function columnExists(table, column) {
  const rows = getDb().prepare(`PRAGMA table_info(${table})`).all();
  return rows.some(row => row.name === column);
}

function migrate() {
  const statements = [];
  if (!columnExists('users', 'role')) {
    statements.push("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
  }
  if (!columnExists('materials', 'course_id')) {
    statements.push('ALTER TABLE materials ADD COLUMN course_id INTEGER');
  }
  if (!columnExists('materials', 'status')) {
    statements.push("ALTER TABLE materials ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'");
  }
  for (const sql of statements) {
    getDb().exec(sql);
  }
  getDb().exec(
    'CREATE INDEX IF NOT EXISTS idx_materials_course_status ON materials (course_id, status, updated_at DESC)'
  );
}

async function initDb() {
  db = new Database(dbPath, { timeout: 5000 });
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
  migrate();
}

function prepare(sql) {
  return {
    get(...args) {
      return getDb().prepare(sql).get(...getParams(args));
    },
    all(...args) {
      return getDb().prepare(sql).all(...getParams(args));
    },
    run(...args) {
      const result = getDb().prepare(sql).run(...getParams(args));
      return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid || 0)
      };
    }
  };
}

module.exports = {
  initDb,
  prepare
};
