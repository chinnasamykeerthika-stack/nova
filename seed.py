"""
NOVA Platform - SQLite Database Seeding Script
"""
from datetime import datetime
from database import get_db, init_db
from analytics import calculate_risk
from recommendations import generate_recommendations

def seed():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear previous records
    cursor.executescript('''
    DELETE FROM FollowUpNotes;
    DELETE FROM Interventions;
    DELETE FROM Recommendations;
    DELETE FROM SubjectPerformance;
    DELETE FROM AcademicRecords;
    DELETE FROM Students;
    DELETE FROM Faculty;
    ''')

    faculty_members = [
        ('Dr. Aris Thorne', 'a.thorne@nova.edu', 'Computer Science', 'Professor & Dean'),
        ('Prof. Maya Lin', 'm.lin@nova.edu', 'Data Science', 'Associate Professor & Mentor Lead'),
        ('Dr. David Kalu', 'd.kalu@nova.edu', 'Electronics & Communication', 'Senior Lecturer'),
        ('Prof. Elena Rostova', 'e.rostova@nova.edu', 'Information Technology', 'Academic Advisor'),
        ('Dr. Samuel Vance', 's.vance@nova.edu', 'Mechanical Engineering', 'Student Success Chair'),
    ]

    cursor.executemany(
        'INSERT INTO Faculty (name, email, department, role) VALUES (?, ?, ?, ?)',
        faculty_members
    )

    demo_students = [
        # High Risk
        {
            'student_id': 'STU-2024-001', 'name': 'Aiden Brooks', 'email': 'aiden.brooks@student.nova.edu',
            'department': 'Computer Science', 'academic_year': 3, 'semester': 5, 'enrollment_date': '2023-08-15',
            'record': {'cgpa': 5.62, 'attendance_pct': 61.4, 'avg_marks': 48.5, 'assignment_completion_pct': 52.0, 'backlogs': 2, 'prev_semester_gpa': 6.80},
            'subjects': [
                ('CS501', 'Database Management Systems', 4, 44.0, 100.0, 'F', 58.0),
                ('CS502', 'Design & Analysis of Algorithms', 4, 52.0, 100.0, 'D', 63.0),
                ('CS503', 'Operating Systems Principles', 3, 47.0, 100.0, 'F', 60.0),
            ]
        },
        {
            'student_id': 'STU-2024-002', 'name': 'Zoe Morales', 'email': 'zoe.morales@student.nova.edu',
            'department': 'Electronics & Communication', 'academic_year': 2, 'semester': 3, 'enrollment_date': '2024-08-12',
            'record': {'cgpa': 5.85, 'attendance_pct': 64.0, 'avg_marks': 52.0, 'assignment_completion_pct': 58.0, 'backlogs': 1, 'prev_semester_gpa': 6.90},
            'subjects': [
                ('EC301', 'Signals & Systems', 4, 46.0, 100.0, 'F', 60.0),
                ('EC302', 'Analog Electronic Circuits', 4, 54.0, 100.0, 'D', 66.0),
            ]
        },
        {
            'student_id': 'STU-2024-003', 'name': 'Tariq Al-Mansoor', 'email': 'tariq.mansoor@student.nova.edu',
            'department': 'Data Science', 'academic_year': 4, 'semester': 7, 'enrollment_date': '2022-08-10',
            'record': {'cgpa': 5.40, 'attendance_pct': 59.2, 'avg_marks': 46.0, 'assignment_completion_pct': 45.0, 'backlogs': 3, 'prev_semester_gpa': 6.20},
            'subjects': [
                ('DS701', 'Deep Learning & Neural Nets', 4, 42.0, 100.0, 'F', 55.0),
                ('DS702', 'Big Data Distributed Systems', 4, 48.0, 100.0, 'F', 61.0),
            ]
        },
        # Moderate Risk
        {
            'student_id': 'STU-2024-004', 'name': 'Liam Chen', 'email': 'liam.chen@student.nova.edu',
            'department': 'Computer Science', 'academic_year': 2, 'semester': 4, 'enrollment_date': '2024-08-12',
            'record': {'cgpa': 6.84, 'attendance_pct': 73.5, 'avg_marks': 64.2, 'assignment_completion_pct': 76.0, 'backlogs': 0, 'prev_semester_gpa': 7.30},
            'subjects': [
                ('CS401', 'Discrete Mathematics', 4, 60.0, 100.0, 'C', 71.0),
                ('CS402', 'Computer Organization', 4, 68.0, 100.0, 'B', 75.0),
            ]
        },
        {
            'student_id': 'STU-2024-005', 'name': 'Chloe Bennett', 'email': 'chloe.bennett@student.nova.edu',
            'department': 'Information Technology', 'academic_year': 3, 'semester': 6, 'enrollment_date': '2023-08-15',
            'record': {'cgpa': 6.95, 'attendance_pct': 74.0, 'avg_marks': 66.8, 'assignment_completion_pct': 78.0, 'backlogs': 0, 'prev_semester_gpa': 7.10},
            'subjects': [
                ('IT601', 'Computer Networks & Security', 4, 64.0, 100.0, 'B', 72.0),
                ('IT602', 'Web Engineering & Cloud', 3, 70.0, 100.0, 'A', 76.0),
            ]
        },
        # Low Risk & Distinction
        {
            'student_id': 'STU-2024-007', 'name': 'Sophia Patel', 'email': 'sophia.patel@student.nova.edu',
            'department': 'Computer Science', 'academic_year': 3, 'semester': 5, 'enrollment_date': '2023-08-15',
            'record': {'cgpa': 9.24, 'attendance_pct': 95.8, 'avg_marks': 91.2, 'assignment_completion_pct': 98.0, 'backlogs': 0, 'prev_semester_gpa': 9.15},
            'subjects': [
                ('CS501', 'Database Management Systems', 4, 94.0, 100.0, 'O', 98.0),
                ('CS502', 'Design & Analysis of Algorithms', 4, 88.0, 100.0, 'A+', 94.0),
            ]
        },
        {
            'student_id': 'STU-2024-008', 'name': 'Marcus Washington', 'email': 'marcus.w@student.nova.edu',
            'department': 'Data Science', 'academic_year': 2, 'semester': 3, 'enrollment_date': '2024-08-12',
            'record': {'cgpa': 8.78, 'attendance_pct': 92.4, 'avg_marks': 86.5, 'assignment_completion_pct': 95.0, 'backlogs': 0, 'prev_semester_gpa': 8.60},
            'subjects': [
                ('DS301', 'Statistical Modeling & Inference', 4, 89.0, 100.0, 'A+', 94.0),
            ]
        },
        {
            'student_id': 'STU-2024-009', 'name': 'Ananya Sharma', 'email': 'ananya.sharma@student.nova.edu',
            'department': 'Electronics & Communication', 'academic_year': 4, 'semester': 7, 'enrollment_date': '2022-08-10',
            'record': {'cgpa': 8.92, 'attendance_pct': 94.0, 'avg_marks': 88.0, 'assignment_completion_pct': 96.0, 'backlogs': 0, 'prev_semester_gpa': 8.85},
            'subjects': [
                ('EC701', 'VLSI Circuit Design', 4, 90.0, 100.0, 'O', 96.0),
            ]
        },
        {
            'student_id': 'STU-2024-010', 'name': 'Ethan O\'Connor', 'email': 'ethan.oc@student.nova.edu',
            'department': 'Mechanical Engineering', 'academic_year': 1, 'semester': 2, 'enrollment_date': '2025-08-20',
            'record': {'cgpa': 7.82, 'attendance_pct': 88.5, 'avg_marks': 78.4, 'assignment_completion_pct': 89.0, 'backlogs': 0, 'prev_semester_gpa': 7.75},
            'subjects': [
                ('ME201', 'Engineering Mechanics', 4, 80.0, 100.0, 'A', 90.0),
            ]
        },
        {
            'student_id': 'STU-2024-011', 'name': 'Fatima Zahra', 'email': 'fatima.z@student.nova.edu',
            'department': 'Information Technology', 'academic_year': 4, 'semester': 8, 'enrollment_date': '2022-08-10',
            'record': {'cgpa': 8.45, 'attendance_pct': 90.0, 'avg_marks': 82.5, 'assignment_completion_pct': 92.0, 'backlogs': 0, 'prev_semester_gpa': 8.35},
            'subjects': [
                ('IT801', 'Cybersecurity Threat Intelligence', 4, 85.0, 100.0, 'A', 91.0),
            ]
        },
        {
            'student_id': 'STU-2024-012', 'name': 'Julian Navarro', 'email': 'julian.n@student.nova.edu',
            'department': 'Computer Science', 'academic_year': 1, 'semester': 1, 'enrollment_date': '2025-08-20',
            'record': {'cgpa': 6.15, 'attendance_pct': 69.8, 'avg_marks': 58.0, 'assignment_completion_pct': 64.0, 'backlogs': 1, 'prev_semester_gpa': 6.40},
            'subjects': [
                ('CS101', 'Introduction to Programming in C', 4, 55.0, 100.0, 'C', 68.0),
            ]
        },
    ]

    now_iso = datetime.now().isoformat()

    for s in demo_students:
        cursor.execute('''
        INSERT INTO Students (student_id, name, email, department, academic_year, semester, enrollment_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
        ''', (s['student_id'], s['name'], s['email'], s['department'], s['academic_year'], s['semester'], s['enrollment_date']))

        r = s['record']
        cursor.execute('''
        INSERT INTO AcademicRecords (student_id, cgpa, attendance_pct, avg_marks, assignment_completion_pct, backlogs, prev_semester_gpa, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (s['student_id'], r['cgpa'], r['attendance_pct'], r['avg_marks'], r['assignment_completion_pct'], r['backlogs'], r['prev_semester_gpa'], now_iso))

        subj_objects = []
        for sub in s['subjects']:
            cursor.execute('''
            INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, credits, marks_obtained, max_marks, grade, attendance_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (s['student_id'], sub[0], sub[1], sub[2], sub[3], sub[4], sub[5], sub[6]))
            subj_objects.append({'subject_code': sub[0], 'subject_name': sub[1], 'marks_obtained': sub[3], 'max_marks': sub[4]})

        # Generate recommendations
        recs = generate_recommendations({
            'student_id': s['student_id'],
            'attendance_pct': r['attendance_pct'],
            'avg_marks': r['avg_marks'],
            'cgpa': r['cgpa'],
            'assignment_completion_pct': r['assignment_completion_pct'],
            'backlogs': r['backlogs'],
        }, subj_objects)

        for rec in recs:
            cursor.execute('''
            INSERT INTO Recommendations (student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (rec['student_id'], rec['issue'], rec['explanation'], rec['recommended_action'], rec['priority'], rec['suggested_review_date'], rec['status'], now_iso))

    # Add sample interventions
    cursor.execute('''
    INSERT INTO Interventions (student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date, status, outcome, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'STU-2024-001', 'Dr. Aris Thorne', 'a.thorne@nova.edu',
        'Severe Attendance Drop & Failing 2 Core CS Papers',
        'Schedule mandatory 1-on-1 parent-faculty advising conference and bi-weekly lab logs.',
        'High', '2026-10-25', 'In Progress',
        'Student attended initial advising session; promised to improve attendance.',
        now_iso, now_iso
    ))
    intervention_id = cursor.lastrowid

    cursor.execute('''
    INSERT INTO FollowUpNotes (intervention_id, note, author, created_at)
    VALUES (?, ?, ?, ?)
    ''', (intervention_id, 'Completed initial diagnostic session. Aiden reported long commute issues.', 'Dr. Aris Thorne', now_iso))

    conn.commit()
    conn.close()
    print("Database successfully seeded with realistic students, records, faculty, and interventions!")

if __name__ == '__main__':
    seed()
