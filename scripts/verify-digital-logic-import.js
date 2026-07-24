const db = require('../server/db');

async function main() {
  await db.initDb();
  const course = db.prepare(`
    SELECT id, name, invite_code
      FROM courses
     WHERE invite_code = ?
  `).get('DIGI2026');
  const material = db.prepare(`
    SELECT id, title, status, html_content
      FROM materials
     WHERE course_id = ? AND base_lesson_id = ?
  `).get(course.id, 'digital-logic-gates-20260723');
  const assignments = db.prepare(`
    SELECT COUNT(*) AS count
      FROM assignments
     WHERE course_id = ? AND material_id = ?
  `).get(course.id, material.id);
  const html = material.html_content;
  const checks = {
    h1: (html.match(/<h1/g) || []).length,
    h2: (html.match(/<h2/g) || []).length,
    h3: (html.match(/<h3/g) || []).length,
    tables: (html.match(/<table/g) || []).length,
    figures: (html.match(/<figure/g) || []).length,
    images: (html.match(/<img/g) || []).length,
    hasMajorityFigure: html.includes('/assets/images/digital-logic/fig01.png'),
    hasSymbolFigure: html.includes('/assets/images/digital-logic/fig02.png'),
    hasAndFigure: html.includes('/assets/images/digital-logic/figAND.png'),
    hasOrFigure: html.includes('/assets/images/digital-logic/figOR.png'),
    hasNotFigure: html.includes('/assets/images/digital-logic/figNOT.png'),
    hasNandFigure: html.includes('/assets/images/digital-logic/figNAND.png'),
    hasNorFigure: html.includes('/assets/images/digital-logic/figNOR.png'),
    assignmentCount: assignments.count
  };
  console.log(JSON.stringify({
    course,
    material: {
      id: material.id,
      title: material.title,
      status: material.status,
      htmlLength: html.length
    },
    checks
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
