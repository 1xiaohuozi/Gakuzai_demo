const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const workspaceDataDir = path.join(__dirname, 'data');
const defaultDataDir = workspaceDataDir;
const dataDir = process.env.GAKUZAI_DATA_DIR || defaultDataDir;
const dbPath = process.env.GAKUZAI_DB_PATH || path.join(dataDir, 'gakuzai.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

fs.mkdirSync(dataDir, { recursive: true });

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

function tableExists(table) {
  const row = getDb().prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
  ).get(table);
  return !!row;
}

function tableSql(table) {
  const row = getDb().prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?"
  ).get(table);
  return row?.sql || '';
}

function migrateAssignmentsTypeConstraint() {
  if (!tableExists('assignments')) return;
  const sql = tableSql('assignments');
  if (!sql || sql.includes("'text'") || sql.includes("'file'")) return;
  getDb().exec(`
    PRAGMA foreign_keys = OFF;
    ALTER TABLE assignments RENAME TO assignments_old;
    CREATE TABLE assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      assignment_type TEXT NOT NULL DEFAULT 'choice' CHECK (assignment_type IN ('choice', 'text', 'file')),
      question_text TEXT NOT NULL,
      choices_json TEXT NOT NULL DEFAULT '[]',
      correct_choice_index INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
      due_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );
    INSERT INTO assignments (
      id, course_id, material_id, teacher_id, title, assignment_type,
      question_text, choices_json, correct_choice_index, status, due_at, created_at, updated_at
    )
    SELECT id, course_id, material_id, teacher_id, title, assignment_type,
           question_text, choices_json, correct_choice_index, status, due_at, created_at, updated_at
    FROM assignments_old;
    DROP TABLE assignments_old;
    PRAGMA foreign_keys = ON;
  `);
}

function migrateAssignmentSubmissionForeignKey() {
  if (!tableExists('assignment_submissions')) return;
  const foreignTables = getDb().prepare('PRAGMA foreign_key_list(assignment_submissions)').all().map(row => row.table);
  if (!foreignTables.some(table => String(table || '').endsWith('assignments_old'))) return;
  getDb().exec(`
    PRAGMA foreign_keys = OFF;
    ALTER TABLE assignment_submissions RENAME TO assignment_submissions_old;
    CREATE TABLE assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      answer_json TEXT NOT NULL DEFAULT '{}',
      choice_index INTEGER,
      is_correct INTEGER NOT NULL DEFAULT 0,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(assignment_id, student_id)
    );
    INSERT INTO assignment_submissions (
      id, assignment_id, student_id, answer_json, choice_index,
      is_correct, submitted_at, updated_at
    )
    SELECT id, assignment_id, student_id, answer_json, choice_index,
           is_correct, submitted_at, updated_at
    FROM assignment_submissions_old;
    DROP TABLE assignment_submissions_old;
    PRAGMA foreign_keys = ON;
  `);
}

function migrate() {
  const statements = [];
  const shouldBackfillDisplayOrder = !columnExists('materials', 'display_order');
  if (!columnExists('users', 'role')) {
    statements.push("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'");
  }
  if (!columnExists('materials', 'course_id')) {
    statements.push('ALTER TABLE materials ADD COLUMN course_id INTEGER');
  }
  if (!columnExists('materials', 'status')) {
    statements.push("ALTER TABLE materials ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'");
  }
  if (shouldBackfillDisplayOrder) {
    statements.push('ALTER TABLE materials ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0');
  }
  if (tableExists('operation_events')) {
    const operationEventColumns = [
      ['operation_index', 'INTEGER'],
      ['material_version_id', 'TEXT'],
      ['block_order', 'INTEGER'],
      ['block_hash', 'TEXT'],
      ['selected_text_hash', 'TEXT'],
      ['before_text', 'TEXT'],
      ['after_text', 'TEXT'],
      ['before_html', 'TEXT'],
      ['after_html', 'TEXT'],
      ['replacement_text', 'TEXT'],
      ['normalized_replacement', 'TEXT'],
      ['previous_event_id', 'TEXT'],
      ['time_since_previous_ms', 'INTEGER'],
      ['is_repeated_block_edit', 'INTEGER NOT NULL DEFAULT 0']
    ];
    for (const [column, definition] of operationEventColumns) {
      if (!columnExists('operation_events', column)) {
        statements.push(`ALTER TABLE operation_events ADD COLUMN ${column} ${definition}`);
      }
    }
  }
  for (const sql of statements) {
    getDb().exec(sql);
  }
  migrateAssignmentsTypeConstraint();
  migrateAssignmentSubmissionForeignKey();
  if (shouldBackfillDisplayOrder) {
    getDb().exec(`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY course_id
                 ORDER BY COALESCE(created_at, updated_at), id
               ) - 1 AS next_order
        FROM materials
      )
      UPDATE materials
         SET display_order = (SELECT next_order FROM ranked WHERE ranked.id = materials.id)
       WHERE id IN (SELECT id FROM ranked)
    `);
  }
  getDb().exec(
    'CREATE INDEX IF NOT EXISTS idx_materials_course_status ON materials (course_id, status, updated_at DESC)'
  );
  getDb().exec(
    'CREATE INDEX IF NOT EXISTS idx_materials_course_order ON materials (course_id, display_order ASC, created_at ASC, id ASC)'
  );
  if (tableExists('assignments')) {
    getDb().exec(
      'CREATE INDEX IF NOT EXISTS idx_assignments_course_material ON assignments (course_id, material_id, status, updated_at DESC)'
    );
  }
  if (tableExists('assignment_submissions')) {
    getDb().exec(
      'CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions (assignment_id, updated_at DESC)'
    );
  }
  if (tableExists('operation_events')) {
    getDb().exec(
      'CREATE INDEX IF NOT EXISTS idx_operation_events_action_created ON operation_events (action_type, created_at DESC)'
    );
    getDb().exec(
      'CREATE INDEX IF NOT EXISTS idx_operation_events_material_block ON operation_events (material_id, block_id, operation_index ASC, created_at ASC)'
    );
    getDb().exec(
      'CREATE INDEX IF NOT EXISTS idx_operation_events_hashes ON operation_events (material_id, block_hash, selected_text_hash)'
    );
  }
}

async function initDb() {
  db = new Database(dbPath, { timeout: 15000 });
  db.pragma('busy_timeout = 15000');
  try {
    db.pragma('journal_mode = WAL');
  } catch (error) {
    console.warn(`SQLite WAL mode unavailable; continuing with default journal mode. ${error.message}`);
  }
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

function transaction(fn) {
  return getDb().transaction(fn);
}

module.exports = {
  initDb,
  prepare,
  transaction,
  dataDir,
  dbPath
};
