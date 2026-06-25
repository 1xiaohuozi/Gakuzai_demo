const http = require("http");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const db = new Database(process.env.STRESS_DB);
const secret = process.env.JWT_SECRET || "dev-only-change-me";
const port = Number(process.env.STRESS_PORT || 3988);

const stamp = Date.now();

const teacher = db.prepare(
  "INSERT INTO users (email,password_hash,display_name,role) VALUES (?,?,?,?)"
).run(`stress-teacher-${stamp}@example.com`, "x", "Stress Teacher", "teacher").lastInsertRowid;

const course = db.prepare(
  "INSERT INTO courses (name,teacher_id,invite_code) VALUES (?,?,?)"
).run("Stress Course", teacher, `STRESS${stamp}`).lastInsertRowid;

db.prepare(
  "INSERT INTO course_members (course_id,user_id,role_in_course) VALUES (?,?,?)"
).run(course, teacher, "teacher");

const material = db.prepare(
  "INSERT INTO materials (user_id,course_id,title,base_lesson_id,html_content,status) VALUES (?,?,?,?,?,?)"
).run(
  teacher,
  course,
  "Stress Material",
  "stress",
  '<p data-block-id="b1">Hello world</p>',
  "published"
).lastInsertRowid;

const insertUser = db.prepare(
  "INSERT INTO users (email,password_hash,display_name,role) VALUES (?,?,?,?)"
);
const insertMember = db.prepare(
  "INSERT INTO course_members (course_id,user_id,role_in_course) VALUES (?,?,?)"
);

const students = [];

for (let i = 1; i <= 40; i++) {
  const id = insertUser.run(
    `stress-student-${stamp}-${i}@example.com`,
    "x",
    `Student ${i}`,
    "student"
  ).lastInsertRowid;

  insertMember.run(course, id, "student");

  students.push({
    id,
    token: jwt.sign(
      { sub: String(id), email: `stress-student-${stamp}-${i}@example.com` },
      secret,
      { expiresIn: "7d" }
    )
  });
}

db.close();

function postBatch(student, count) {
  const events = Array.from({ length: count }, (_, index) => ({
    clientEventId: `stress-${stamp}-${student.id}-${index}`,
    materialId: Number(material),
    actionType: index % 2 ? "marker" : "keyword",
    actionParams: index % 2 ? {} : { keyword: "▽" },
    selection: {
      text: index % 2 ? "world" : "Hello",
      blockId: "b1",
      blockText: "Hello world"
    },
    clientTime: new Date().toISOString()
  }));

  const body = JSON.stringify({ events });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "localhost",
      port,
      path: "/api/analytics/operation-events/batch",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${student.token}`
      }
    }, res => {
      let text = "";
      res.on("data", chunk => { text += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(text || "{}"));
        } else {
          reject(new Error(`${res.statusCode} ${text}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const started = Date.now();

  const results = await Promise.all(
    students.map(student => postBatch(student, 20))
  );

  const check = new Database(process.env.STRESS_DB, { readonly: true });
  const count = check.prepare(
    "SELECT COUNT(*) AS n, COUNT(DISTINCT user_id) AS students FROM operation_events WHERE client_event_id LIKE ?"
  ).get(`stress-${stamp}-%`);
  check.close();

  console.log({
    requests: results.length,
    accepted: results.reduce((n, r) => n + r.accepted, 0),
    inserted: results.reduce((n, r) => n + r.inserted, 0),
    stored: count.n,
    students: count.students,
    ms: Date.now() - started
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});