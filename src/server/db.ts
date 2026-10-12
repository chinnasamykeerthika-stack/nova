import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { computeRiskScore, DEFAULT_THRESHOLDS } from './analytics.ts';
import { generatePersonalizedRecommendations } from './recommendations.ts';
import { INITIAL_INTERVENTIONS, SEED_FACULTY, SEED_STUDENTS } from './seedData.ts';
import { ThresholdSettings } from '../types.ts';

const DB_DIR = path.resolve(process.cwd(), 'instance');
const DB_PATH = path.resolve(DB_DIR, 'nova.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);

  // Check if students exist, if not seed
  const countRes = dbInstance.exec('SELECT COUNT(*) as cnt FROM Students');
  const count = countRes.length > 0 && countRes[0].values.length > 0 ? (countRes[0].values[0][0] as number) : 0;
  if (count === 0) {
    seedDatabase(dbInstance);
  }

  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS Students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      academic_year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      enrollment_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS AcademicRecords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      cgpa REAL NOT NULL,
      attendance_pct REAL NOT NULL,
      avg_marks REAL NOT NULL,
      assignment_completion_pct REAL NOT NULL,
      backlogs INTEGER NOT NULL DEFAULT 0,
      prev_semester_gpa REAL NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS SubjectPerformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      grade TEXT NOT NULL,
      attendance_pct REAL NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      issue TEXT NOT NULL,
      explanation TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      priority TEXT NOT NULL,
      suggested_review_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      mentor_name TEXT NOT NULL,
      mentor_email TEXT NOT NULL,
      issue TEXT NOT NULL,
      planned_action TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      outcome TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS FollowUpNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intervention_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(intervention_id) REFERENCES Interventions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ThresholdSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      low_threshold REAL NOT NULL,
      high_threshold REAL NOT NULL,
      attendance_weight REAL NOT NULL,
      marks_weight REAL NOT NULL,
      cgpa_weight REAL NOT NULL,
      assignment_weight REAL NOT NULL,
      trend_weight REAL NOT NULL
    );
  `);
}

export function seedDatabase(db: Database): void {
  // Clear existing
  db.run(`
    DELETE FROM FollowUpNotes;
    DELETE FROM Interventions;
    DELETE FROM Recommendations;
    DELETE FROM SubjectPerformance;
    DELETE FROM AcademicRecords;
    DELETE FROM Students;
    DELETE FROM Faculty;
    DELETE FROM ThresholdSettings;
  `);

  // Insert default thresholds
  const stmtSettings = db.prepare(`
    INSERT INTO ThresholdSettings (low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmtSettings.run([
    DEFAULT_THRESHOLDS.low_threshold,
    DEFAULT_THRESHOLDS.high_threshold,
    DEFAULT_THRESHOLDS.attendance_weight,
    DEFAULT_THRESHOLDS.marks_weight,
    DEFAULT_THRESHOLDS.cgpa_weight,
    DEFAULT_THRESHOLDS.assignment_weight,
    DEFAULT_THRESHOLDS.trend_weight,
  ]);
  stmtSettings.free();

  // Insert faculty
  const stmtFaculty = db.prepare(`INSERT INTO Faculty (name, email, department, role) VALUES (?, ?, ?, ?)`);
  for (const f of SEED_FACULTY) {
    stmtFaculty.run([f.name, f.email, f.department, f.role]);
  }
  stmtFaculty.free();

  // Insert students
  const stmtStudent = db.prepare(`
    INSERT INTO Students (student_id, name, email, department, academic_year, semester, enrollment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtRecord = db.prepare(`
    INSERT INTO AcademicRecords (student_id, cgpa, attendance_pct, avg_marks, assignment_completion_pct, backlogs, prev_semester_gpa, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtSubject = db.prepare(`
    INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, credits, marks_obtained, max_marks, grade, attendance_pct)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtRec = db.prepare(`
    INSERT INTO Recommendations (student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nowIso = new Date().toISOString();

  for (const s of SEED_STUDENTS) {
    stmtStudent.run([s.student_id, s.name, s.email, s.department, s.academic_year, s.semester, s.enrollment_date, s.status]);
    stmtRecord.run([
      s.student_id,
      s.record.cgpa,
      s.record.attendance_pct,
      s.record.avg_marks,
      s.record.assignment_completion_pct,
      s.record.backlogs,
      s.record.prev_semester_gpa,
      nowIso,
    ]);

    for (const sub of s.subjects) {
      stmtSubject.run([
        s.student_id,
        sub.subject_code,
        sub.subject_name,
        sub.credits,
        sub.marks_obtained,
        sub.max_marks,
        sub.grade,
        sub.attendance_pct,
      ]);
    }

    // Generate personalized recommendations
    const generatedRecs = generatePersonalizedRecommendations(
      {
        student_id: s.student_id,
        name: s.name,
        attendance_pct: s.record.attendance_pct,
        avg_marks: s.record.avg_marks,
        cgpa: s.record.cgpa,
        assignment_completion_pct: s.record.assignment_completion_pct,
        backlogs: s.record.backlogs,
        prev_semester_gpa: s.record.prev_semester_gpa,
      },
      s.subjects
    );

    for (const rec of generatedRecs) {
      stmtRec.run([
        rec.student_id,
        rec.issue,
        rec.explanation,
        rec.recommended_action,
        rec.priority,
        rec.suggested_review_date,
        rec.status,
        rec.created_at,
      ]);
    }
  }

  stmtStudent.free();
  stmtRecord.free();
  stmtSubject.free();
  stmtRec.free();

  // Insert Interventions and Notes
  const stmtIntervention = db.prepare(`
    INSERT INTO Interventions (student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date, status, outcome, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtNote = db.prepare(`
    INSERT INTO FollowUpNotes (intervention_id, note, author, created_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const inter of INITIAL_INTERVENTIONS) {
    stmtIntervention.run([
      inter.student_id,
      inter.mentor_name,
      inter.mentor_email,
      inter.issue,
      inter.planned_action,
      inter.priority,
      inter.due_date,
      inter.status,
      inter.outcome || '',
      nowIso,
      nowIso,
    ]);

    const lastIdRes = db.exec('SELECT last_insert_rowid()');
    const interventionId = lastIdRes[0].values[0][0] as number;

    for (const note of inter.notes) {
      stmtNote.run([interventionId, note.note, note.author, note.created_at]);
    }
  }

  stmtIntervention.free();
  stmtNote.free();
}

export function getThresholdSettings(db: Database): ThresholdSettings {
  const res = db.exec('SELECT low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight FROM ThresholdSettings LIMIT 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const row = res[0].values[0];
    return {
      low_threshold: Number(row[0]),
      high_threshold: Number(row[1]),
      attendance_weight: Number(row[2]),
      marks_weight: Number(row[3]),
      cgpa_weight: Number(row[4]),
      assignment_weight: Number(row[5]),
      trend_weight: Number(row[6]),
    };
  }
  return DEFAULT_THRESHOLDS;
}

export function updateThresholdSettings(db: Database, settings: ThresholdSettings): void {
  db.run(`
    UPDATE ThresholdSettings
    SET low_threshold = ?, high_threshold = ?, attendance_weight = ?, marks_weight = ?, cgpa_weight = ?, assignment_weight = ?, trend_weight = ?
    WHERE id = (SELECT id FROM ThresholdSettings LIMIT 1)
  `, [
    settings.low_threshold,
    settings.high_threshold,
    settings.attendance_weight,
    settings.marks_weight,
    settings.cgpa_weight,
    settings.assignment_weight,
    settings.trend_weight,
  ]);
  saveDb();
}
