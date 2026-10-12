"""
NOVA Platform - SQLite Database Layer
"""
import os
import sqlite3
from datetime import datetime

INSTANCE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
DB_PATH = os.path.join(INSTANCE_DIR, 'nova.db')

def get_db():
    if not os.path.exists(INSTANCE_DIR):
        os.makedirs(INSTANCE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
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
    ''')

    # Seed default threshold settings if empty
    cursor.execute('SELECT COUNT(*) FROM ThresholdSettings')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO ThresholdSettings (low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight)
        VALUES (40.0, 70.0, 0.30, 0.25, 0.25, 0.15, 0.05)
        ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("NOVA database initialized successfully.")
