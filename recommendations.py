"""
NOVA Platform - Rule-Based Personalized Recommendation Engine
"""
from datetime import datetime, timedelta

def generate_recommendations(student_data, subjects=None):
    """
    Generates actionable, personalized academic improvement tasks based on student metrics.
    """
    subjects = subjects or []
    recommendations = []
    now = datetime.now()

    def review_date(days):
        return (now + timedelta(days=days)).strftime('%Y-%m-%d')

    att = float(student_data.get('attendance_pct') or 100.0)
    marks = float(student_data.get('avg_marks') or 100.0)
    cgpa = float(student_data.get('cgpa') or 10.0)
    assign = float(student_data.get('assignment_completion_pct') or 100.0)
    backlogs = int(student_data.get('backlogs') or 0)
    student_id = student_data.get('student_id', '')

    # 1. Attendance
    if att < 65.0:
        recommendations.append({
            'student_id': student_id,
            'issue': 'Severe Attendance Shortfall (<65%)',
            'explanation': f"Current attendance of {att:.1f}% violates mandatory university regulations for examination eligibility.",
            'recommended_action': "Issue administrative notice, schedule parent-advisor conference, and mandate daily check-in log with department office.",
            'priority': 'High',
            'suggested_review_date': review_date(7),
            'status': 'Pending'
        })
    elif att < 75.0:
        recommendations.append({
            'student_id': student_id,
            'issue': 'Attendance Below Accreditation Cutoff (65-74%)',
            'explanation': f"Attendance stands at {att:.1f}%. Unexcused absence from 3 more hours risks debarment.",
            'recommended_action': "Implement bi-weekly attendance audit with academic proctor.",
            'priority': 'Medium',
            'suggested_review_date': review_date(14),
            'status': 'Pending'
        })

    # 2. Subject Weakness
    low_subs = [s for s in subjects if float(s.get('marks_obtained', 100)) < 50.0]
    if low_subs:
        codes = ", ".join(s.get('subject_code', '') for s in low_subs)
        recommendations.append({
            'student_id': student_id,
            'issue': f"Subject Mastery Failure in: {codes}",
            'explanation': f"Student scored below passing minimum (50%) in {len(low_subs)} subject(s).",
            'recommended_action': f"Enroll in weekly faculty clinic for {codes} and assign peer tutor for problem-solving practice.",
            'priority': 'High',
            'suggested_review_date': review_date(10),
            'status': 'Pending'
        })
    elif marks < 60.0:
        recommendations.append({
            'student_id': student_id,
            'issue': 'Assessment Marks Below Average (<60%)',
            'explanation': f"Internal assessment average of {marks:.1f}% trails cohort distribution.",
            'recommended_action': "Schedule 1-on-1 concept review and provide solved question bank modules.",
            'priority': 'Medium',
            'suggested_review_date': review_date(14),
            'status': 'Pending'
        })

    # 3. Coursework Assignments
    if assign < 70.0:
        recommendations.append({
            'student_id': student_id,
            'issue': f"Coursework Delinquency ({assign:.1f}% submitted)",
            'explanation': "Multiple lab assignments or tutorial sheets remain unsubmitted, reducing continuous internal marks.",
            'recommended_action': "Authorize structured 10-day coursework recovery window under lab assistant supervision.",
            'priority': 'Medium',
            'suggested_review_date': review_date(10),
            'status': 'Pending'
        })

    # 4. Backlogs
    if backlogs > 0:
        recommendations.append({
            'student_id': student_id,
            'issue': f"Active Course Backlogs ({backlogs} paper(s))",
            'explanation': "Pending arrears jeopardize regular progression and campus placement clearance.",
            'recommended_action': "Construct dedicated supplementary exam study plan and arrange mock review tests.",
            'priority': 'High',
            'suggested_review_date': review_date(21),
            'status': 'Pending'
        })

    # 5. Excellence
    if cgpa >= 8.5 and att >= 85.0 and marks >= 80.0:
        recommendations.append({
            'student_id': student_id,
            'issue': 'Distinction Track & Enrichment',
            'explanation': f"Exemplary performance maintained (CGPA: {cgpa:.2f}, Attendance: {att:.1f}%).",
            'recommended_action': "Nominate for department research mentorship and invite to serve as peer learning facilitator.",
            'priority': 'Low',
            'suggested_review_date': review_date(30),
            'status': 'In Progress'
        })

    if not recommendations:
        recommendations.append({
            'student_id': student_id,
            'issue': 'Routine Academic Cadence',
            'explanation': f"Student maintains balanced pacing across all criteria with CGPA of {cgpa:.2f}.",
            'recommended_action': "Sustain regular monthly mentor check-in and explore industry specialization electives.",
            'priority': 'Low',
            'suggested_review_date': review_date(30),
            'status': 'In Progress'
        })

    return recommendations
