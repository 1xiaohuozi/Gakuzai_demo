const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'gakuzai.sqlite');
fs.mkdirSync(dataDir, { recursive: true });

const SQL = initSqlJs({
  locateFile: file => require.resolve(`sql.js/dist/${file}`)
});

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

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

function persist() {
  const data = getDb().export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function initDb() {
  const SqlJs = await SQL;
  db = fs.existsSync(dbPath)
    ? new SqlJs.Database(fs.readFileSync(dbPath))
    : new SqlJs.Database();
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schema);
  persist();
}

function prepare(sql) {
  return {
    get(...args) {
      const stmt = getDb().prepare(sql);
      try {
        stmt.bind(getParams(args));
        return stmt.step() ? stmt.getAsObject() : undefined;
      } finally {
        stmt.free();
      }
    },
    all(...args) {
      const stmt = getDb().prepare(sql);
      const rows = [];
      try {
        stmt.bind(getParams(args));
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      } finally {
        stmt.free();
      }
    },
    run(...args) {
      const stmt = getDb().prepare(sql);
      try {
        stmt.run(getParams(args));
      } finally {
        stmt.free();
      }
      const lastId = getDb().exec('SELECT last_insert_rowid() AS id')[0]?.values?.[0]?.[0] || 0;
      const changes = getDb().exec('SELECT changes() AS changes')[0]?.values?.[0]?.[0] || 0;
      persist();
      return {
        changes,
        lastInsertRowid: lastId
      };
    }
  };
}

module.exports = {
  initDb,
  prepare
};
