const fs = require('fs');
const path = require('path');
const db = require('../server/db');

const SOURCE_HTML = 'D:/下载/00Digital.html';
const FIGURE_SOURCE_DIR = 'D:/下载';
const FIGURE_TARGET_DIR = path.join(__dirname, '..', 'assets', 'images', 'digital-logic');

const FIGURE_FILES = [
  'fig01.png',
  'fig02.png',
  'figAND.png',
  'figOR.png',
  'figNOT.png',
  'figNAND.png',
  'figNOR.png'
];

function ensureTeacher() {
  return db.prepare(`
    SELECT id, email, display_name, role
      FROM users
     WHERE role IN ('teacher', 'admin')
     ORDER BY CASE WHEN email = 'teacher_test@example.com' THEN 0 ELSE 1 END, id
     LIMIT 1
  `).get();
}

function copyFigures() {
  fs.mkdirSync(FIGURE_TARGET_DIR, { recursive: true });
  for (const fileName of FIGURE_FILES) {
    fs.copyFileSync(
      path.join(FIGURE_SOURCE_DIR, fileName),
      path.join(FIGURE_TARGET_DIR, fileName)
    );
  }
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : html.trim();
}

function normalizeOriginalHtml(bodyHtml) {
  const formulaBlock = expression => `
<div class="digital-source-formula">
  ${expression}
</div>`;

  return bodyHtml
    // 原文件这里是 <h2>はじめに</2>，浏览器也许能容错，但导入系统时修正成合法 HTML。
    .replace(/<h2>はじめに<\/2>/g, '<h2>はじめに</h2>')
    // 系统编辑区不会自动执行 MathJax，所以把原 HTML 中的 LaTeX 公式转换为普通 HTML。
    .replace(/\\\[\s*結果=\\bar\{A\}BC\+A\\bar\{B\}C\+AB\\bar\{C\}\+ABC = AB\+BC\+CA\s*\\\]/g, formulaBlock(
      '結果 = <span class="overline">A</span>BC + A<span class="overline">B</span>C + AB<span class="overline">C</span> + ABC = AB + BC + CA'
    ))
    .replace(/\\\[\s*F=A \\cdot B = AB\s*\\\]/g, formulaBlock('F = A・B = AB'))
    .replace(/\\\[\s*F=A\+B\s*\\\]/g, formulaBlock('F = A + B'))
    .replace(/\\\[\s*F=\\bar\{A\}\s*\\\]/g, formulaBlock('F = <span class="overline">A</span>'))
    .replace(/\\\[\s*F=\\overline\{AB\}\s*\\\]/g, formulaBlock('F = <span class="overline">AB</span>'))
    .replace(/\\\[\s*F=\\overline\{A\+B\}\s*\\\]/g, formulaBlock('F = <span class="overline">A + B</span>'))
    // 只替换图片访问路径，不改正文内容。
    .replace(/src="(fig(?:01|02|AND|OR|NOT|NAND|NOR)\.png)"/g, 'src="/assets/images/digital-logic/$1"')
    // 给原表格增加系统内阅读时的基本可读性，不改变表格内容。
    .replace(/<table border="1">/g, '<table border="1" class="digital-source-table">');
}

function buildHtml() {
  const source = fs.readFileSync(SOURCE_HTML, 'utf8');
  const body = normalizeOriginalHtml(extractBody(source));
  return `
<section data-block-id="digital-source-root" class="digital-source-material" style="font-family:'Yu Gothic','Meiryo',sans-serif;line-height:1.75;color:#000;max-width:900px;margin:0 auto;">
  <style>
    .digital-source-material h1 {
      margin: 0 0 16px;
      padding: 0;
      color: #000;
      font-size: 30px;
      font-weight: 700;
    }
    .digital-source-material h2 {
      margin: 26px 0 10px;
      padding: 0;
      border-bottom: 1px solid #bbb;
      color: #000;
      font-size: 24px;
    }
    .digital-source-material h3 {
      margin: 20px 0 8px;
      color: #000;
      font-size: 18px;
    }
    .digital-source-material p {
      margin: 10px 0;
    }
    .digital-source-material figure {
      margin: 18px 0;
      padding: 0;
      border: none;
      background: transparent;
    }
    .digital-source-material figure img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .digital-source-material figcaption {
      margin-top: 6px;
      text-align: center;
      color: #333;
      font-size: 14px;
    }
    .digital-source-material .digital-source-table {
      border-collapse: collapse;
      margin: 14px auto 18px;
      text-align: center;
      background: #fff;
    }
    .digital-source-material .digital-source-table caption {
      margin-bottom: 6px;
      font-weight: 700;
      text-align: center;
      caption-side: top;
    }
    .digital-source-material .digital-source-table th,
    .digital-source-material .digital-source-table td {
      padding: 6px 10px;
      border: 1px solid #777;
      min-width: 42px;
    }
    .digital-source-material .digital-source-table th {
      background: #fff;
    }
    .digital-source-material .digital-source-table .out {
      border-left: 4px double #000;
      background: #fff;
      font-weight: 700;
    }
    .digital-source-material .digital-source-formula {
      margin: 14px 0;
      padding: 4px 0;
      background: transparent;
      border: none;
      text-align: center;
      font-size: 20px;
      font-family: "Times New Roman", "Yu Gothic", "Meiryo", serif;
    }
    .digital-source-material .overline {
      text-decoration: overline;
      text-decoration-thickness: 1.5px;
    }
  </style>
${body}
</section>`;
}

async function main() {
  copyFigures();
  await db.initDb();

  const teacher = ensureTeacher();
  if (!teacher) throw new Error('No teacher/admin user found.');

  const inviteCode = 'DIGI2026';
  const courseName = 'デジタル回路（真理値表とゲート素子）';
  const description = '2026年7月23日の小型授業テスト用電子教材。';
  const semester = '2026 夏・小型教材テスト';
  const title = 'デジタル回路：真理値表とゲート素子';
  const baseLessonId = 'digital-logic-gates-20260723';
  const html = buildHtml();

  const importTransaction = db.transaction(() => {
    let course = db.prepare('SELECT * FROM courses WHERE invite_code = ?').get(inviteCode);
    if (!course) {
      const result = db.prepare(`
        INSERT INTO courses (name, description, teacher_id, semester, invite_code)
        VALUES (?, ?, ?, ?, ?)
      `).run(courseName, description, teacher.id, semester, inviteCode);
      course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare(`
        UPDATE courses
           SET name = ?, description = ?, teacher_id = ?, semester = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
      `).run(courseName, description, teacher.id, semester, course.id);
      course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course.id);
    }

    db.prepare(`
      INSERT OR IGNORE INTO course_members (course_id, user_id, role_in_course)
      VALUES (?, ?, 'teacher')
    `).run(course.id, teacher.id);

    let material = db.prepare(`
      SELECT * FROM materials
       WHERE course_id = ? AND base_lesson_id = ?
    `).get(course.id, baseLessonId);

    if (!material) {
      const nextOrder = db.prepare(`
        SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order
          FROM materials
         WHERE course_id = ?
      `).get(course.id).next_order || 0;
      const result = db.prepare(`
        INSERT INTO materials (
          user_id, course_id, title, base_lesson_id, html_content, log_json, status, display_order
        )
        VALUES (?, ?, ?, ?, ?, '[]', 'published', ?)
      `).run(teacher.id, course.id, title, baseLessonId, html, nextOrder);
      material = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare(`
        UPDATE materials
           SET user_id = ?, title = ?, html_content = ?, log_json = '[]',
               status = 'published', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
      `).run(teacher.id, title, html, material.id);
      material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material.id);
    }

    db.prepare(`
      INSERT INTO user_events (user_id, event_type, metadata_json)
      VALUES (?, 'digital_material_import_original_html', ?)
    `).run(teacher.id, JSON.stringify({
      courseId: course.id,
      materialId: material.id,
      inviteCode,
      source: '00Digital.html',
      policy: 'original HTML body preserved; only image paths and invalid h2 closing tag fixed'
    }));

    return { teacher, course, material };
  });

  const result = importTransaction();
  console.log(JSON.stringify({
    ok: true,
    teacher: result.teacher,
    course: {
      id: result.course.id,
      name: result.course.name,
      inviteCode: result.course.invite_code
    },
    material: {
      id: result.material.id,
      title: result.material.title,
      status: result.material.status,
      htmlLength: result.material.html_content.length
    }
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
