"""
NOVA – AI-Powered Student Analytics and Success Platform
Flask REST Backend & Web Server
"""
import os
from datetime import datetime
from flask import Flask, jsonify, request, render_template, send_from_directory
from database import get_db, init_db
from analytics import calculate_risk, DEFAULT_THRESHOLDS
from recommendations import generate_recommendations

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['JSON_SORT_KEYS'] = False

@app.before_first_request
def setup_app():
    init_db()

@app.route('/')
def index():
    return render_template('index.html') if os.path.exists('templates/index.html') else jsonify({"status": "NOVA Platform Active"})

@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    conn = get_db()
    cursor = conn.cursor()

    students = cursor.execute('''
        SELECT s.student_id, s.name, s.department, s.academic_year,
               r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
        FROM Students s
        LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
    ''').fetchall()

    th_row = cursor.execute('SELECT low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight FROM ThresholdSettings LIMIT 1').fetchone()
    thresholds = dict(th_row) if th_row else DEFAULT_THRESHOLDS

    total_students = len(students)
    sum_cgpa = 0.0
    sum_att = 0.0
    needing_support = 0
    performing_well = 0

    risk_counts = {'High': 0, 'Moderate': 0, 'Low': 0}
    dept_map = {}
    scatter = []
    alerts = []

    for s in students:
        cgpa = float(s['cgpa'] or 0.0)
        att = float(s['attendance_pct'] or 0.0)
        marks = float(s['avg_marks'] or 0.0)
        assign = float(s['assignment_completion_pct'] or 0.0)
        backlogs = int(s['backlogs'] or 0)

        sum_cgpa += cgpa
        sum_att += att

        risk = calculate_risk({
            'student_id': s['student_id'],
            'attendance_pct': att,
            'avg_marks': marks,
            'cgpa': cgpa,
            'assignment_completion_pct': assign,
            'backlogs': backlogs
        }, thresholds)

        risk_cat = risk['risk_category']
        risk_counts[risk_cat] = risk_counts.get(risk_cat, 0) + 1

        if risk_cat == 'High':
            needing_support += 1
            if len(alerts) < 5:
                alerts.append({
                    'id': f"alert-{s['student_id']}",
                    'student_id': s['student_id'],
                    'student_name': s['name'],
                    'department': s['department'],
                    'issue': risk['explanation'],
                    'risk_score': risk['risk_score']
                })
        elif risk_cat == 'Low' and (cgpa >= 8.0 or marks >= 80.0):
            performing_well += 1

        scatter.append({
            'student_id': s['student_id'],
            'name': s['name'],
            'attendance': round(att, 1),
            'marks': round(marks, 1),
            'risk': risk_cat
        })

        dept = s['department'] or 'General'
        if dept not in dept_map:
            dept_map[dept] = {'total_cgpa': 0.0, 'total_att': 0.0, 'count': 0}
        dept_map[dept]['total_cgpa'] += cgpa
        dept_map[dept]['total_att'] += att
        dept_map[dept]['count'] += 1

    pending_interventions = cursor.execute("SELECT COUNT(*) FROM Interventions WHERE status != 'Completed'").fetchone()[0]

    # CGPA histogram bins
    gpa_bins = [
        {'label': '< 6.0', 'count': sum(1 for s in students if float(s['cgpa'] or 0) < 6.0)},
        {'label': '6.0 - 6.9', 'count': sum(1 for s in students if 6.0 <= float(s['cgpa'] or 0) < 7.0)},
        {'label': '7.0 - 7.9', 'count': sum(1 for s in students if 7.0 <= float(s['cgpa'] or 0) < 8.0)},
        {'label': '8.0 - 8.9', 'count': sum(1 for s in students if 8.0 <= float(s['cgpa'] or 0) < 9.0)},
        {'label': '9.0 - 10.0', 'count': sum(1 for s in students if float(s['cgpa'] or 0) >= 9.0)},
    ]

    dept_perf = [
        {
            'department': d,
            'avg_cgpa': round(data['total_cgpa'] / data['count'], 2),
            'avg_attendance': round(data['total_att'] / data['count'], 1),
            'student_count': data['count']
        }
        for d, data in dept_map.items()
    ]

    risk_dist = [
        {'category': 'Low Risk', 'count': risk_counts['Low'], 'percentage': round((risk_counts['Low'] / total_students) * 100) if total_students else 0},
        {'category': 'Moderate Risk', 'count': risk_counts['Moderate'], 'percentage': round((risk_counts['Moderate'] / total_students) * 100) if total_students else 0},
        {'category': 'High Risk', 'count': risk_counts['High'], 'percentage': round((risk_counts['High'] / total_students) * 100) if total_students else 0},
    ]

    recent_acts = cursor.execute('''
        SELECT i.id, i.student_id, s.name as student_name, i.mentor_name, i.issue, i.created_at
        FROM Interventions i
        LEFT JOIN Students s ON i.student_id = s.student_id
        ORDER BY i.created_at DESC LIMIT 5
    ''').fetchall()

    activities = [
        {
            'id': f"act-{a['id']}",
            'type': 'intervention',
            'description': f"Intervention for {a['student_name'] or a['student_id']}: {a['issue']}",
            'timestamp': a['created_at'],
            'actor': a['mentor_name']
        }
        for a in recent_acts
    ]

    return jsonify({
        'summary': {
            'total_students': total_students,
            'avg_cgpa': round(sum_cgpa / total_students, 2) if total_students else 0.0,
            'avg_attendance': round(sum_att / total_students, 1) if total_students else 0.0,
            'needing_support': needingSupport,
            'performing_well': performingWell,
            'pending_interventions': pending_interventions
        },
        'charts': {
            'performance_distribution': gpa_bins,
            'attendance_vs_marks': scatter,
            'department_performance': dept_perf,
            'monthly_trends': [
                {'month': 'Jun', 'avg_marks': 74.2, 'avg_attendance': 84.1},
                {'month': 'Jul', 'avg_marks': 72.8, 'avg_attendance': 82.5},
                {'month': 'Aug', 'avg_marks': 70.4, 'avg_attendance': 80.2},
                {'month': 'Sep', 'avg_marks': 68.9, 'avg_attendance': 78.4},
                {'month': 'Oct', 'avg_marks': 71.5, 'avg_attendance': 79.8},
            ],
            'risk_distribution': risk_dist
        },
        'recent_activities': activities,
        'critical_alerts': alerts
    })

@app.route('/api/students', methods=['GET'])
def api_get_students():
    q = request.args.get('q', '').strip().lower()
    dept = request.args.get('dept', '')
    year = int(request.args.get('year', 0))
    risk_filter = request.args.get('risk', '')
    page = max(1, int(request.args.get('page', 1)))
    limit = max(1, int(request.args.get('limit', 10)))

    conn = get_db()
    cursor = conn.cursor()

    rows = cursor.execute('''
        SELECT s.id, s.student_id, s.name, s.email, s.department, s.academic_year, s.semester, s.enrollment_date, s.status,
               r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
        FROM Students s
        LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
        ORDER BY s.id ASC
    ''').fetchall()

    th_row = cursor.execute('SELECT low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight FROM ThresholdSettings LIMIT 1').fetchone()
    thresholds = dict(th_row) if th_row else DEFAULT_THRESHOLDS

    students = []
    for r in rows:
        risk = calculate_risk({
            'student_id': r['student_id'],
            'attendance_pct': r['attendance_pct'],
            'avg_marks': r['avg_marks'],
            'cgpa': r['cgpa'],
            'assignment_completion_pct': r['assignment_completion_pct'],
            'backlogs': r['backlogs']
        }, thresholds)

        item = {
            'id': r['id'],
            'student_id': r['student_id'],
            'name': r['name'],
            'email': r['email'],
            'department': r['department'],
            'academic_year': r['academic_year'],
            'semester': r['semester'],
            'enrollment_date': r['enrollment_date'],
            'status': r['status'],
            'cgpa': float(r['cgpa'] or 0.0),
            'attendance_pct': float(r['attendance_pct'] or 0.0),
            'avg_marks': float(r['avg_marks'] or 0.0),
            'assignment_completion_pct': float(r['assignment_completion_pct'] or 0.0),
            'backlogs': int(r['backlogs'] or 0),
            'prev_semester_gpa': float(r['prev_semester_gpa'] or 0.0),
            'risk_score': risk['risk_score'],
            'risk_category': risk['risk_category']
        }
        students.append(item)

    if q:
        students = [s for s in students if q in s['name'].lower() or q in s['student_id'].lower() or q in s['email'].lower()]
    if dept and dept != 'All':
        students = [s for s in students if s['department'] == dept]
    if year > 0:
        students = [s for s in students if s['academic_year'] == year]
    if risk_filter and risk_filter != 'All':
        students = [s for s in students if s['risk_category'] == risk_filter]

    total = len(students)
    start = (page - 1) * limit
    paginated = students[start:start + limit]

    return jsonify({
        'students': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit else 1
    })

@app.route('/api/students', methods=['POST'])
def api_create_student():
    data = request.json or {}
    sid = data.get('student_id')
    name = data.get('name')
    email = data.get('email')
    dept = data.get('department')

    if not sid or not name or not email or not dept:
        return jsonify({'error': 'Student ID, Name, Email, and Department are required.'}), 400

    conn = get_db()
    cursor = conn.cursor()

    existing = cursor.execute('SELECT id FROM Students WHERE student_id = ?', (sid,)).fetchone()
    if existing:
        return jsonify({'error': f'Student ID {sid} already exists.'}), 409

    year = int(data.get('academic_year') or 1)
    sem = int(data.get('semester') or 1)
    enroll = data.get('enrollment_date') or datetime.now().strftime('%Y-%m-%d')
    cgpa = float(data.get('cgpa') or 7.0)
    att = float(data.get('attendance_pct') or 75.0)
    marks = float(data.get('avg_marks') or 65.0)
    assign = float(data.get('assignment_completion_pct') or 80.0)
    backlogs = int(data.get('backlogs') or 0)
    now_iso = datetime.now().isoformat()

    cursor.execute('''
        INSERT INTO Students (student_id, name, email, department, academic_year, semester, enrollment_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    ''', (sid, name, email, dept, year, sem, enroll))

    cursor.execute('''
        INSERT INTO AcademicRecords (student_id, cgpa, attendance_pct, avg_marks, assignment_completion_pct, backlogs, prev_semester_gpa, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (sid, cgpa, att, marks, assign, backlogs, cgpa, now_iso))

    recs = generate_recommendations({
        'student_id': sid,
        'attendance_pct': att,
        'avg_marks': marks,
        'cgpa': cgpa,
        'assignment_completion_pct': assign,
        'backlogs': backlogs
    })

    for r in recs:
        cursor.execute('''
            INSERT INTO Recommendations (student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (sid, r['issue'], r['explanation'], r['recommended_action'], r['priority'], r['suggested_review_date'], r['status'], now_iso))

    conn.commit()
    return jsonify({'message': 'Student created successfully', 'student_id': sid}), 201

@app.route('/api/students/<student_id>', methods=['GET'])
def api_get_student_detail(student_id):
    conn = get_db()
    cursor = conn.cursor()

    row = cursor.execute('''
        SELECT s.id, s.student_id, s.name, s.email, s.department, s.academic_year, s.semester, s.enrollment_date, s.status,
               r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa, r.updated_at
        FROM Students s
        LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
        WHERE s.student_id = ? OR s.id = ?
    ''', (student_id, student_id)).fetchone()

    if not row:
        return jsonify({'error': 'Student not found'}), 404

    sid = row['student_id']
    subjects = [dict(sub) for sub in cursor.execute('SELECT * FROM SubjectPerformance WHERE student_id = ?', (sid,)).fetchall()]
    recommendations = [dict(rec) for rec in cursor.execute('SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC', (sid,)).fetchall()]
    interventions = [dict(inter) for inter in cursor.execute('SELECT * FROM Interventions WHERE student_id = ? ORDER BY id DESC', (sid,)).fetchall()]

    for inter in interventions:
        notes = cursor.execute('SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY id ASC', (inter['id'],)).fetchall()
        inter['notes'] = [dict(n) for n in notes]

    th_row = cursor.execute('SELECT low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight FROM ThresholdSettings LIMIT 1').fetchone()
    thresholds = dict(th_row) if th_row else DEFAULT_THRESHOLDS

    risk = calculate_risk({
        'student_id': sid,
        'attendance_pct': row['attendance_pct'],
        'avg_marks': row['avg_marks'],
        'cgpa': row['cgpa'],
        'assignment_completion_pct': row['assignment_completion_pct'],
        'backlogs': row['backlogs'],
        'prev_semester_gpa': row['prev_semester_gpa']
    }, thresholds)

    return jsonify({
        'student': dict(row),
        'subjects': subjects,
        'recommendations': recommendations,
        'interventions': interventions,
        'risk_analysis': risk
    })

@app.route('/api/students/<student_id>', methods=['PUT'])
def api_update_student(student_id):
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()

    row = cursor.execute('SELECT student_id FROM Students WHERE student_id = ? OR id = ?', (student_id, student_id)).fetchone()
    if not row:
        return jsonify({'error': 'Student not found'}), 404
    sid = row['student_id']

    cursor.execute('''
        UPDATE Students
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            department = COALESCE(?, department),
            academic_year = COALESCE(?, academic_year),
            semester = COALESCE(?, semester),
            status = COALESCE(?, status)
        WHERE student_id = ?
    ''', (data.get('name'), data.get('email'), data.get('department'), data.get('academic_year'), data.get('semester'), data.get('status'), sid))

    now_iso = datetime.now().isoformat()
    cursor.execute('''
        UPDATE AcademicRecords
        SET cgpa = COALESCE(?, cgpa),
            attendance_pct = COALESCE(?, attendance_pct),
            avg_marks = COALESCE(?, avg_marks),
            assignment_completion_pct = COALESCE(?, assignment_completion_pct),
            backlogs = COALESCE(?, backlogs),
            prev_semester_gpa = COALESCE(?, prev_semester_gpa),
            updated_at = ?
        WHERE student_id = ?
    ''', (data.get('cgpa'), data.get('attendance_pct'), data.get('avg_marks'), data.get('assignment_completion_pct'), data.get('backlogs'), data.get('prev_semester_gpa'), now_iso, sid))

    conn.commit()
    return jsonify({'message': 'Student updated successfully', 'student_id': sid})

@app.route('/api/students/<student_id>', methods=['DELETE'])
def api_delete_student(student_id):
    conn = get_db()
    cursor = conn.cursor()
    row = cursor.execute('SELECT student_id FROM Students WHERE student_id = ? OR id = ?', (student_id, student_id)).fetchone()
    if not row:
        return jsonify({'error': 'Student not found'}), 404
    sid = row['student_id']

    cursor.execute('DELETE FROM FollowUpNotes WHERE intervention_id IN (SELECT id FROM Interventions WHERE student_id = ?)', (sid,))
    cursor.execute('DELETE FROM Interventions WHERE student_id = ?', (sid,))
    cursor.execute('DELETE FROM Recommendations WHERE student_id = ?', (sid,))
    cursor.execute('DELETE FROM SubjectPerformance WHERE student_id = ?', (sid,))
    cursor.execute('DELETE FROM AcademicRecords WHERE student_id = ?', (sid,))
    cursor.execute('DELETE FROM Students WHERE student_id = ?', (sid,))

    conn.commit()
    return jsonify({'message': f'Student {sid} deleted successfully'})

@app.route('/api/simulate', methods=['POST'])
def api_simulate():
    data = request.json or {}
    sid = data.get('student_id')

    conn = get_db()
    cursor = conn.cursor()

    th_row = cursor.execute('SELECT low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight FROM ThresholdSettings LIMIT 1').fetchone()
    thresholds = dict(th_row) if th_row else DEFAULT_THRESHOLDS

    current = {
        'student_id': sid or 'HYPOTHETICAL',
        'attendance_pct': 65.0,
        'avg_marks': 54.0,
        'cgpa': 5.80,
        'assignment_completion_pct': 60.0,
        'backlogs': 2,
    }

    if sid:
        row = cursor.execute('''
            SELECT r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs
            FROM AcademicRecords r WHERE r.student_id = ?
        ''', (sid,)).fetchone()
        if row:
            current['attendance_pct'] = float(row['attendance_pct'] or 0)
            current['avg_marks'] = float(row['avg_marks'] or 0)
            current['cgpa'] = float(row['cgpa'] or 0)
            current['assignment_completion_pct'] = float(row['assignment_completion_pct'] or 0)
            current['backlogs'] = int(row['backlogs'] or 0)

    cur_risk = calculate_risk(current, thresholds)

    sim_att = float(data.get('simulated_attendance', current['attendance_pct']))
    sim_marks = float(data.get('simulated_marks', current['avg_marks']))
    sim_cgpa = float(data.get('simulated_cgpa', current['cgpa']))
    sim_assign = float(data.get('simulated_assignment', current['assignment_completion_pct']))
    sim_backlogs = int(data.get('simulated_backlogs', current['backlogs']))

    sim_data = {
        'student_id': current['student_id'],
        'attendance_pct': sim_att,
        'avg_marks': sim_marks,
        'cgpa': sim_cgpa,
        'assignment_completion_pct': sim_assign,
        'backlogs': sim_backlogs,
    }
    sim_risk = calculate_risk(sim_data, thresholds)

    diff = sim_risk['risk_score'] - cur_risk['risk_score']

    return jsonify({
        'current_risk': cur_risk,
        'simulated_risk': sim_risk,
        'score_difference': diff,
        'changed_factors': [
            {'factor': 'Attendance', 'current': current['attendance_pct'], 'simulated': sim_att, 'difference': round(sim_att - current['attendance_pct'], 1), 'unit': '%'},
            {'factor': 'Assessment Marks', 'current': current['avg_marks'], 'simulated': sim_marks, 'difference': round(sim_marks - current['avg_marks'], 1), 'unit': '%'},
            {'factor': 'CGPA', 'current': current['cgpa'], 'simulated': sim_cgpa, 'difference': round(sim_cgpa - current['cgpa'], 2), 'unit': ' / 10'},
            {'factor': 'Assignment Submissions', 'current': current['assignment_completion_pct'], 'simulated': sim_assign, 'difference': round(sim_assign - current['assignment_completion_pct'], 1), 'unit': '%'},
            {'factor': 'Backlogs', 'current': current['backlogs'], 'simulated': sim_backlogs, 'difference': sim_backlogs - current['backlogs'], 'unit': ' courses'},
        ],
        'suggested_next_steps': [
            f"Targeting attendance above 75% will yield immediate de-escalation of academic risk.",
            f"Hypothetical difference: {'Improvement of ' + str(abs(diff)) + ' points' if diff < 0 else 'Risk increase of ' + str(diff) + ' points' if diff > 0 else 'No score change'}."
        ]
    })

@app.route('/api/interventions', methods=['GET'])
def api_get_interventions():
    conn = get_db()
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT i.*, s.name as student_name, s.department
        FROM Interventions i
        LEFT JOIN Students s ON i.student_id = s.student_id
        ORDER BY i.created_at DESC
    ''').fetchall()

    result = []
    for r in rows:
        item = dict(r)
        notes = cursor.execute('SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY id ASC', (item['id'],)).fetchall()
        item['notes'] = [dict(n) for n in notes]
        result.append(item)

    return jsonify(result)

@app.route('/api/interventions', methods=['POST'])
def api_create_intervention():
    data = request.json or {}
    sid = data.get('student_id')
    mentor = data.get('mentor_name')
    issue = data.get('issue')
    action = data.get('planned_action')
    due = data.get('due_date')

    if not sid or not mentor or not issue or not action or not due:
        return jsonify({'error': 'Missing required intervention fields'}), 400

    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()

    cursor.execute('''
        INSERT INTO Interventions (student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date, status, outcome, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, ?)
    ''', (sid, mentor, data.get('mentor_email', 'mentor@nova.edu'), issue, action, data.get('priority', 'Medium'), due, now_iso, now_iso))

    conn.commit()
    return jsonify({'message': 'Intervention created successfully'}), 201

@app.route('/api/interventions/<int:id>/notes', methods=['POST'])
def api_add_note(id):
    data = request.json or {}
    note = data.get('note')
    if not note:
        return jsonify({'error': 'Note content cannot be empty'}), 400

    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO FollowUpNotes (intervention_id, note, author, created_at)
        VALUES (?, ?, ?, ?)
    ''', (id, note.strip(), data.get('author', 'Faculty Mentor'), now_iso))
    cursor.execute('UPDATE Interventions SET updated_at = ? WHERE id = ?', (now_iso, id))
    conn.commit()

    return jsonify({'message': 'Note added successfully'}), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting NOVA Flask Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
