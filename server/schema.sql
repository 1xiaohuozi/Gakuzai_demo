CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id INTEGER NOT NULL,
  semester TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_in_course TEXT NOT NULL DEFAULT 'student' CHECK (role_in_course IN ('student', 'teacher', 'assistant')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  title TEXT NOT NULL,
  base_lesson_id TEXT NOT NULL,
  html_content TEXT NOT NULL,
  log_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_materials_user_updated
ON materials (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS student_material_works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  edited_content TEXT NOT NULL,
  operation_logs TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(material_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_material_works_student
ON student_material_works (student_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS operation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT UNIQUE,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  material_id INTEGER,
  student_work_id INTEGER,
  base_lesson_id TEXT,
  action_type TEXT NOT NULL,
  action_params_json TEXT NOT NULL DEFAULT '{}',
  selected_text TEXT,
  selected_html TEXT,
  block_id TEXT,
  block_text TEXT,
  operation_index INTEGER,
  material_version_id TEXT,
  block_order INTEGER,
  block_hash TEXT,
  selected_text_hash TEXT,
  before_text TEXT,
  after_text TEXT,
  before_html TEXT,
  after_html TEXT,
  replacement_text TEXT,
  normalized_replacement TEXT,
  previous_event_id TEXT,
  time_since_previous_ms INTEGER,
  is_repeated_block_edit INTEGER NOT NULL DEFAULT 0,
  start_offset INTEGER,
  end_offset INTEGER,
  client_time TEXT,
  session_id TEXT,
  device_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (student_work_id) REFERENCES student_material_works(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operation_events_material_user_created
ON operation_events (material_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operation_events_course_created
ON operation_events (course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_created
ON user_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER NOT NULL,
  setting_key TEXT NOT NULL,
  setting_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, setting_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
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

CREATE INDEX IF NOT EXISTS idx_assignments_course_material
ON assignments (course_id, material_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS assignment_submissions (
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

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
ON assignment_submissions (assignment_id, updated_at DESC);
