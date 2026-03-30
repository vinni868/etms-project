-- ================================================================
--  EtMS v4.0 — MASTER SQL MIGRATION SCRIPT
--  Database: etms_db_final
--  All 47 tables — safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

USE etms_db_final;

-- ────────────────────────────────────────────────────────────────
-- 1. PATCH EXISTING users TABLE (add v4.0 columns)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP;

-- Add PENDING_APPROVAL and INACTIVE statuses
ALTER TABLE users MODIFY COLUMN status 
  ENUM('ACTIVE','PENDING','PENDING_APPROVAL','REJECTED','INACTIVE') DEFAULT 'PENDING';

-- ────────────────────────────────────────────────────────────────
-- 2. ROLES & PERMISSIONS
-- ────────────────────────────────────────────────────────────────
INSERT IGNORE INTO role_master (role_name) VALUES
  ('SUPER_ADMIN'),('ADMIN'),('SUB_ADMIN'),('TRAINER'),
  ('STUDENT'),('MARKETER'),('COUNSELOR');

ALTER TABLE permission_master ADD COLUMN IF NOT EXISTS module      VARCHAR(100);
ALTER TABLE permission_master ADD COLUMN IF NOT EXISTS description VARCHAR(300);

INSERT IGNORE INTO permission_master (permission_name, module) VALUES
  ('MANAGE_SYSTEM','system'),     ('CREATE_ADMIN','system'),
  ('CREATE_MARKETER','system'),   ('CREATE_COUNSELOR','system'),
  ('CREATE_SUB_ADMIN','system'),  ('APPROVE_SUB_ADMIN','system'),
  ('MANAGE_STUDENTS','admin'),    ('MANAGE_TRAINERS','admin'),
  ('MANAGE_COURSES','admin'),     ('MANAGE_BATCHES','admin'),
  ('MANAGE_FEES','admin'),        ('MANAGE_SALARIES','finance'),
  ('MANAGE_REFERRALS','admin'),   ('MANAGE_DOCUMENTS','admin'),
  ('UPLOAD_VIDEOS','training'),   ('MANAGE_ANNOUNCEMENTS','admin'),
  ('MANAGE_MEETINGS','admin'),    ('APPROVE_LEAVE','admin'),
  ('MARK_ATTENDANCE','training'), ('VIEW_ATTENDANCE','training'),
  ('MANAGE_ASSIGNMENTS','training'),('SUBMIT_ASSIGNMENTS','student'),
  ('MANAGE_TASKS','training'),    ('VIEW_TASKS','training'),
  ('MANAGE_PROJECTS','training'), ('VIEW_PROJECTS','training'),
  ('MANAGE_SESSIONS','training'), ('MANAGE_FEEDBACK','training'),
  ('SUBMIT_FEEDBACK','student'),  ('MANAGE_JOBS','placement'),
  ('APPLY_JOBS','student'),       ('MANAGE_PLACEMENT','placement'),
  ('MOCK_INTERVIEW','placement'),  ('MANAGE_STAR_OF_BATCH','training'),
  ('MANAGE_LEADS','marketing'),   ('SEND_CAMPAIGNS','marketing'),
  ('MANAGE_COUNSELING','counselor'),('VIEW_REPORTS','reports'),
  ('VIEW_BUSINESS_ANALYTICS','finance'),('RESET_PASSWORDS','admin'),
  ('VIEW_SCAN_REPORTS','admin'),  ('ENGLISH_LEARNING','student'),
  ('REFERRAL_BONUS','student');

ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS granted_by BIGINT;
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS granted_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- ────────────────────────────────────────────────────────────────
-- 3. STUDENT PROFILES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id                  BIGINT UNIQUE NOT NULL,
  student_id_code          VARCHAR(50) UNIQUE,
  gender                   VARCHAR(10),
  dob                      DATE,
  highest_qualification    VARCHAR(200),
  institution_name         VARCHAR(300),
  field_of_study           VARCHAR(200),
  graduation_year          YEAR,
  percentage_cgpa          VARCHAR(50),
  school_name              VARCHAR(300),
  board                    VARCHAR(100),
  twelfth_percentage       VARCHAR(20),
  twelfth_year             YEAR,
  tenth_school             VARCHAR(300),
  tenth_percentage         VARCHAR(20),
  tenth_year               YEAR,
  has_work_experience      BOOLEAN DEFAULT FALSE,
  total_experience_years   VARCHAR(20),
  guardian_name            VARCHAR(200),
  guardian_relation        VARCHAR(50),
  guardian_phone           VARCHAR(15),
  guardian_email           VARCHAR(150),
  skills                   TEXT,
  bio                      TEXT,
  profile_pic              VARCHAR(500),
  address                  TEXT,
  city                     VARCHAR(100),
  state                    VARCHAR(100),
  pincode                  VARCHAR(10),
  linkedin_url             VARCHAR(500),
  github_url               VARCHAR(500),
  english_learning_enabled BOOLEAN DEFAULT FALSE,
  referral_code            VARCHAR(20) UNIQUE,
  referred_by_code         VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- is_current=TRUE → end_date NULL → display "Currently Working"
CREATE TABLE IF NOT EXISTS student_work_experience (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id   BIGINT NOT NULL,
  company_name VARCHAR(300) NOT NULL,
  job_title    VARCHAR(200),
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_current   BOOLEAN DEFAULT FALSE,
  description  TEXT,
  skills_used  VARCHAR(500),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS student_education (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id      BIGINT NOT NULL,
  degree          VARCHAR(200),
  institution     VARCHAR(300),
  field_of_study  VARCHAR(200),
  start_year      YEAR,
  end_year        YEAR,
  percentage_cgpa VARCHAR(50),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNIQUE NOT NULL,
  gender           VARCHAR(10),
  specialization   VARCHAR(200),
  experience_years VARCHAR(50),
  qualification    VARCHAR(200),
  bio              TEXT,
  profile_pic      VARCHAR(500),
  address          TEXT,
  city             VARCHAR(100),
  state            VARCHAR(100),
  pincode          VARCHAR(10),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 4. BATCH COURSES (multi-course per batch)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batch_courses (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id  BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  UNIQUE (batch_id, course_id),
  FOREIGN KEY (batch_id)  REFERENCES batches(id),
  FOREIGN KEY (course_id) REFERENCES course_master(id)
);

-- Add course_id to student_batches if missing
ALTER TABLE student_batches ADD COLUMN IF NOT EXISTS course_id BIGINT;

-- ────────────────────────────────────────────────────────────────
-- 5. PASSWORD RESET TOKENS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  token      VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 6. FINANCIAL TABLES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fees (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id      BIGINT NOT NULL,
  batch_id        BIGINT,
  total_amount    DECIMAL(10,2) NOT NULL,
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  due_amount      DECIMAL(10,2),
  payment_date    DATE,
  payment_mode    VARCHAR(50),
  receipt_number  VARCHAR(100) UNIQUE,
  status          VARCHAR(20) DEFAULT 'PENDING',
  notes           TEXT,
  collected_by    BIGINT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES users(id),
  FOREIGN KEY (batch_id)     REFERENCES batches(id),
  FOREIGN KEY (collected_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payment_qr (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  upi_id        VARCHAR(200),
  qr_image_path VARCHAR(500),
  account_name  VARCHAR(200),
  is_active     BOOLEAN DEFAULT TRUE,
  uploaded_by   BIGINT,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS referrals (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  referrer_id          BIGINT NOT NULL,
  referred_user_id     BIGINT,
  referred_name        VARCHAR(200),
  referred_phone       VARCHAR(20),
  referral_code_used   VARCHAR(20),
  status               VARCHAR(30) DEFAULT 'PENDING',
  bonus_amount         DECIMAL(10,2),
  bonus_type           VARCHAR(30),
  bonus_status         VARCHAR(20) DEFAULT 'PENDING',
  bank_account_no      VARCHAR(50),
  bank_ifsc            VARCHAR(20),
  bank_name            VARCHAR(100),
  credited_at          DATETIME,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS employee_salaries (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id  BIGINT NOT NULL,
  base_salary  DECIMAL(10,2) NOT NULL,
  allowances   DECIMAL(10,2) DEFAULT 0,
  deductions   DECIMAL(10,2) DEFAULT 0,
  net_salary   DECIMAL(10,2),
  month        INT NOT NULL,
  year         INT NOT NULL,
  payment_date DATE,
  payment_mode VARCHAR(50),
  status       VARCHAR(20) DEFAULT 'PENDING',
  notes        TEXT,
  paid_by      BIGINT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, month, year),
  FOREIGN KEY (employee_id) REFERENCES users(id),
  FOREIGN KEY (paid_by)     REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  category     VARCHAR(100),
  description  VARCHAR(300),
  amount       DECIMAL(10,2) NOT NULL,
  expense_date DATE,
  paid_by      BIGINT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paid_by) REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 7. OPERATIONS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  doc_type    VARCHAR(100),
  file_name   VARCHAR(255),
  file_path   VARCHAR(500),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified    BOOLEAN DEFAULT FALSE,
  verified_by BIGINT,
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  batch_id      BIGINT,
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  reason        TEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'PENDING',
  approved_by   BIGINT,
  approval_note TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (batch_id)    REFERENCES batches(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS holidays (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  date       DATE NOT NULL UNIQUE,
  type       VARCHAR(50),
  created_by BIGINT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  content      TEXT,
  target_roles JSON,
  batch_id     BIGINT,
  is_popup     BOOLEAN DEFAULT FALSE,
  created_by   BIGINT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  read_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS meetings (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(300) NOT NULL,
  agenda        TEXT,
  meeting_link  VARCHAR(1000),
  scheduled_at  DATETIME NOT NULL,
  duration_min  INT,
  target_type   VARCHAR(30),
  target_roles  JSON,
  created_by    BIGINT,
  status        VARCHAR(20) DEFAULT 'SCHEDULED',
  meeting_notes TEXT,
  recording_url VARCHAR(1000),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  meeting_id BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  attended   BOOLEAN DEFAULT FALSE,
  UNIQUE (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 8. QR SCAN (already partially exists — ensure columns)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE time_tracking ADD COLUMN IF NOT EXISTS session_count INT DEFAULT 1;

-- ────────────────────────────────────────────────────────────────
-- 9. COMMUNICATIONS
-- ────────────────────────────────────────────────────────────────
-- messages.parent_id = thread reply context (NOT student's guardian)
CREATE TABLE IF NOT EXISTS messages (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id   BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  batch_id    BIGINT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  parent_id   BIGINT,
  sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)   REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  title      VARCHAR(300),
  message    TEXT,
  type       VARCHAR(50),
  link       VARCHAR(500),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS violations (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id  BIGINT NOT NULL,
  batch_id    BIGINT,
  type        VARCHAR(50),
  description TEXT,
  severity    VARCHAR(20),
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (batch_id)   REFERENCES batches(id)
);

-- ────────────────────────────────────────────────────────────────
-- 10. TRAINING MODULE
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id    BIGINT NOT NULL,
  trainer_id  BIGINT,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  instructions TEXT,
  deadline    DATETIME,
  target_type VARCHAR(20) DEFAULT 'ALL',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id      BIGINT NOT NULL,
  student_id   BIGINT NOT NULL,
  status       VARCHAR(30) DEFAULT 'PENDING',
  submission   TEXT,
  submitted_at DATETIME,
  completed_at DATETIME,
  trainer_note VARCHAR(500),
  FOREIGN KEY (task_id)    REFERENCES tasks(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id    BIGINT NOT NULL,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  tech_stack  VARCHAR(500),
  instructions TEXT,
  deadline    DATE,
  status      VARCHAR(20) DEFAULT 'ACTIVE',
  assigned_by BIGINT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id   BIGINT NOT NULL,
  student_id   BIGINT NOT NULL,
  progress_pct INT DEFAULT 0,
  current_task TEXT,
  status       VARCHAR(30) DEFAULT 'ASSIGNED',
  github_url   VARCHAR(500),
  completed_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_updates (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT NOT NULL,
  updated_by    BIGINT,
  update_note   TEXT,
  new_progress  INT,
  next_steps    TEXT,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES project_assignments(id),
  FOREIGN KEY (updated_by)    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id     BIGINT NOT NULL,
  trainer_id   BIGINT,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  test_type    VARCHAR(50),
  duration_min INT,
  due_date     DATETIME,
  max_attempts INT DEFAULT 1,
  shuffle_q    BOOLEAN DEFAULT FALSE,
  show_score   BOOLEAN DEFAULT TRUE,
  status       VARCHAR(20) DEFAULT 'ACTIVE',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id   BIGINT NOT NULL,
  type            VARCHAR(50),
  question        TEXT NOT NULL,
  options         JSON,
  correct_answer  TEXT,
  marks           INT DEFAULT 1,
  difficulty      VARCHAR(20),
  explanation     TEXT,
  starter_code    TEXT,
  expected_output TEXT,
  hints           TEXT,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  assignment_id  BIGINT NOT NULL,
  student_id     BIGINT NOT NULL,
  answers        JSON,
  score          INT,
  total_marks    INT,
  percentage     DECIMAL(5,2),
  submitted_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  attempt_no     INT DEFAULT 1,
  time_taken_min INT,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id),
  FOREIGN KEY (student_id)    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id          BIGINT NOT NULL,
  student_id        BIGINT NOT NULL,
  trainer_id        BIGINT,
  week_number       INT NOT NULL,
  week_start        DATE,
  rating            INT,
  comments          TEXT,
  is_to_super_admin BOOLEAN DEFAULT FALSE,
  super_admin_msg   TEXT,
  submitted_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS online_sessions (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id     BIGINT NOT NULL,
  trainer_id   BIGINT,
  title        VARCHAR(300),
  meeting_link VARCHAR(1000),
  scheduled_at DATETIME,
  duration_min INT,
  status       VARCHAR(20) DEFAULT 'SCHEDULED',
  recording_url VARCHAR(1000),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS performance_meetings (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id      BIGINT NOT NULL,
  batch_id        BIGINT,
  triggered_by    BIGINT,
  reason          TEXT,
  performance_pct DECIMAL(5,2),
  meeting_link    VARCHAR(1000),
  scheduled_at    DATETIME,
  status          VARCHAR(20) DEFAULT 'PENDING',
  meeting_notes   TEXT,
  action_plan     TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES users(id),
  FOREIGN KEY (triggered_by) REFERENCES users(id)
);

-- Star of Batch: per course, per batch, per month
CREATE TABLE IF NOT EXISTS star_of_batch (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id   BIGINT NOT NULL,
  course_id  BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  month      INT NOT NULL,
  year       INT NOT NULL,
  reason     TEXT,
  awarded_by BIGINT,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (batch_id, course_id, month, year),
  FOREIGN KEY (batch_id)   REFERENCES batches(id),
  FOREIGN KEY (course_id)  REFERENCES course_master(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (awarded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS course_materials (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id     BIGINT NOT NULL,
  title        VARCHAR(300) NOT NULL,
  type         VARCHAR(50),
  file_path    VARCHAR(500),
  url          VARCHAR(1000),
  description  TEXT,
  class_date   DATE,
  duration_min INT,
  is_recording BOOLEAN DEFAULT FALSE,
  uploaded_by  BIGINT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id)    REFERENCES batches(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  week_start           DATE NOT NULL,
  week_end             DATE NOT NULL,
  submitted_by         BIGINT,
  total_students       INT,
  active_students      INT,
  new_enrollments      INT,
  total_fees_collected DECIMAL(10,2),
  attendance_avg       DECIMAL(5,2),
  violations_count     INT,
  notes                TEXT,
  submitted_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 11. PLACEMENT MODULE
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(300) NOT NULL,
  company        VARCHAR(200) NOT NULL,
  location       VARCHAR(200),
  description    TEXT,
  requirements   TEXT,
  skills_needed  TEXT,
  salary_range   VARCHAR(100),
  job_type       VARCHAR(50),
  is_paid        BOOLEAN DEFAULT TRUE,
  stipend        VARCHAR(100),
  apply_deadline DATE NOT NULL,
  posted_by      BIGINT,
  status         VARCHAR(20) DEFAULT 'ACTIVE',
  notify_matched BOOLEAN DEFAULT TRUE,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS job_applications (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id           BIGINT NOT NULL,
  student_id       BIGINT NOT NULL,
  resume_snapshot  TEXT,
  status           VARCHAR(30) DEFAULT 'APPLIED',
  cover_letter     TEXT,
  rejection_reason TEXT,
  applied_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)     REFERENCES jobs(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS resumes (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id     BIGINT UNIQUE NOT NULL,
  objective      TEXT,
  skills         TEXT,
  experience     TEXT,
  education      TEXT,
  projects_list  TEXT,
  certifications TEXT,
  github_url     VARCHAR(500),
  linkedin_url   VARCHAR(500),
  portfolio_url  VARCHAR(500),
  ats_score      INT,
  ats_feedback   TEXT,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mock_interviews (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id       BIGINT NOT NULL,
  job_id           BIGINT,
  interviewer_id   BIGINT,
  scheduled_at     DATETIME,
  type             VARCHAR(50),
  status           VARCHAR(20) DEFAULT 'SCHEDULED',
  score            INT,
  feedback         TEXT,
  strengths        TEXT,
  areas_to_improve TEXT,
  recording_url    VARCHAR(1000),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)     REFERENCES users(id),
  FOREIGN KEY (interviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS interview_prep (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id     BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  topics     TEXT,
  questions  JSON,
  resources  TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)     REFERENCES jobs(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 12. MARKETING & COUNSELING
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(200) NOT NULL,
  email                VARCHAR(200),
  phone                VARCHAR(20) NOT NULL,
  course_interest      VARCHAR(300),
  source               VARCHAR(100),
  status               VARCHAR(50) DEFAULT 'NEW',
  priority             VARCHAR(20) DEFAULT 'MEDIUM',
  assigned_to          BIGINT,
  next_followup_date   DATE,
  notes                TEXT,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  converted_at         DATETIME,
  converted_student_id BIGINT,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS lead_communications (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  lead_id   BIGINT NOT NULL,
  type      VARCHAR(50),
  direction VARCHAR(10),
  message   TEXT,
  status    VARCHAR(30),
  sent_by   BIGINT,
  sent_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (sent_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(300) NOT NULL,
  type             VARCHAR(50),
  message_template TEXT,
  target_type      VARCHAR(50),
  status           VARCHAR(20) DEFAULT 'DRAFT',
  sent_count       INT DEFAULT 0,
  delivered_count  INT DEFAULT 0,
  read_count       INT DEFAULT 0,
  reply_count      INT DEFAULT 0,
  scheduled_at     DATETIME,
  sent_at          DATETIME,
  created_by       BIGINT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS counseling_sessions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id      BIGINT NOT NULL,
  counselor_id    BIGINT NOT NULL,
  scheduled_at    DATETIME,
  type            VARCHAR(50),
  status          VARCHAR(20) DEFAULT 'SCHEDULED',
  meeting_link    VARCHAR(1000),
  notes           TEXT,
  action_items    TEXT,
  next_session_at DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES users(id),
  FOREIGN KEY (counselor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS counselor_assignments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  counselor_id BIGINT NOT NULL,
  student_id   BIGINT NOT NULL,
  assigned_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (counselor_id, student_id),
  FOREIGN KEY (counselor_id) REFERENCES users(id),
  FOREIGN KEY (student_id)   REFERENCES users(id)
);

-- ────────────────────────────────────────────────────────────────
-- 13. ENGLISH LEARNING
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS english_learning_content (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(300),
  type        VARCHAR(50),
  content_url VARCHAR(1000),
  level       VARCHAR(30),
  created_by  BIGINT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS english_learning_progress (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id   BIGINT NOT NULL,
  content_id   BIGINT NOT NULL,
  completed    BOOLEAN DEFAULT FALSE,
  score        INT,
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (content_id) REFERENCES english_learning_content(id)
);

-- ────────────────────────────────────────────────────────────────
-- 14. SUPER ADMIN SEED (safe — uses WHERE NOT EXISTS)
-- ────────────────────────────────────────────────────────────────
INSERT IGNORE INTO users (name, email, password, phone, role_id, status)
SELECT 'Super Admin', 'superadmin@etms.com', 'superadmin123', '9000000001',
       (SELECT id FROM role_master WHERE role_name = 'SUPER_ADMIN'), 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@etms.com');

-- NOTE: Run GET /api/migration/migrate-passwords after startup to BCrypt this.

-- ────────────────────────────────────────────────────────────────
-- END OF MIGRATION SCRIPT
-- Tables: 47 | EtMS v4.0 | Safe to re-run (IF NOT EXISTS)
-- ────────────────────────────────────────────────────────────────
