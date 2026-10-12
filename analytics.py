"""
NOVA Platform - Explainable AI Risk Analysis Engine
Formula-driven, transparent scoring module.
"""

DEFAULT_THRESHOLDS = {
    'low_threshold': 40.0,
    'high_threshold': 70.0,
    'attendance_weight': 0.30,
    'marks_weight': 0.25,
    'cgpa_weight': 0.25,
    'assignment_weight': 0.15,
    'trend_weight': 0.05,
}

def calculate_sub_score(factor_type, value, aux_value=None):
    """
    Computes deterministic sub-score (0 to 100) and human-readable explanation.
    Missing data is flagged and mapped to a neutral baseline (30) to avoid false penalty.
    """
    if value is None:
        return {
            'score': 30.0,
            'status': 'Moderate',
            'summary': 'Metric not yet logged; neutral screening baseline applied.',
            'is_missing': True
        }

    val = float(value)
    score = 0.0
    status = 'Good'
    summary = ''

    if factor_type == 'attendance':
        if val >= 85.0:
            score = max(0.0, (100.0 - val) * 1.0)
            status = 'Good'
            summary = f"Optimal lecture attendance at {val:.1f}%. Meets accreditation cutoff."
        elif val >= 75.0:
            score = 15.0 + ((85.0 - val) / 10.0) * 35.0
            status = 'Moderate'
            summary = f"Acceptable attendance at {val:.1f}%, but nearing 75% examination cutoff."
        elif val >= 65.0:
            score = 50.0 + ((75.0 - val) / 10.0) * 30.0
            status = 'Critical'
            summary = f"Below mandatory 75% limit ({val:.1f}%). Exam debarment warning issued."
        else:
            score = min(100.0, 80.0 + ((65.0 - val) / 65.0) * 20.0)
            status = 'Critical'
            summary = f"Critical absenteeism at {val:.1f}%. Immediate faculty intervention mandated."

    elif factor_type == 'marks':
        if val >= 75.0:
            score = max(0.0, (100.0 - val) * 0.6)
            status = 'Good'
            summary = f"Strong course mastery with {val:.1f}% average assessment score."
        elif val >= 60.0:
            score = 15.0 + ((75.0 - val) / 15.0) * 35.0
            status = 'Moderate'
            summary = f"Satisfactory mark of {val:.1f}%. Conceptual reinforcement recommended."
        elif val >= 50.0:
            score = 50.0 + ((60.0 - val) / 10.0) * 30.0
            status = 'Critical'
            summary = f"Near-passing mark of {val:.1f}%. High risk of internal test failure."
        else:
            score = min(100.0, 80.0 + ((50.0 - val) / 50.0) * 20.0)
            status = 'Critical'
            summary = f"Failing internal marks ({val:.1f}%). Requires structured remediation."

    elif factor_type == 'cgpa':
        if val >= 8.0:
            score = max(0.0, (10.0 - val) * 7.5)
            status = 'Good'
            summary = f"Distinction tier CGPA of {val:.2f}."
        elif val >= 7.0:
            score = 15.0 + ((8.0 - val) / 1.0) * 30.0
            status = 'Moderate'
            summary = f"Solid CGPA of {val:.2f}."
        elif val >= 6.0:
            score = 45.0 + ((7.0 - val) / 1.0) * 35.0
            status = 'Critical'
            summary = f"Marginal CGPA ({val:.2f}). Approaching academic notice range."
        else:
            score = min(100.0, 80.0 + ((6.0 - max(0.0, val)) / 6.0) * 20.0)
            status = 'Critical'
            summary = f"Critical CGPA of {val:.2f}. Behind graduation qualification benchmarks."

    elif factor_type == 'assignment':
        if val >= 90.0:
            score = max(0.0, (100.0 - val) * 1.0)
            status = 'Good'
            summary = f"High coursework compliance ({val:.1f}% on-time submissions)."
        elif val >= 75.0:
            score = 10.0 + ((90.0 - val) / 15.0) * 35.0
            status = 'Moderate'
            summary = f"Moderate assignment adherence ({val:.1f}%). Minor delays."
        elif val >= 60.0:
            score = 45.0 + ((75.0 - val) / 15.0) * 35.0
            status = 'Critical'
            summary = f"Low submission rate ({val:.1f}%). Several lab reports delinquent."
        else:
            score = min(100.0, 80.0 + ((60.0 - val) / 60.0) * 20.0)
            status = 'Critical'
            summary = f"Severe coursework delinquency ({val:.1f}%). Continuous credits in danger."

    elif factor_type == 'trend':
        backlogs = int(aux_value or 0)
        trend_score = min(60.0, backlogs * 30.0)
        score = min(100.0, trend_score)
        if score < 25.0:
            status = 'Good'
            summary = "Clear standing with zero active paper backlogs."
        elif score < 60.0:
            status = 'Moderate'
            summary = f"{backlogs} active course backlog(s) registered."
        else:
            status = 'Critical'
            summary = f"Multiple backlogs ({backlogs}) impeding degree completion."

    return {
        'score': round(min(100.0, max(0.0, score)), 1),
        'status': status,
        'summary': summary,
        'is_missing': False
    }

def calculate_risk(student_data, thresholds=None):
    """
    Main risk assessment calculator.
    """
    t = thresholds or DEFAULT_THRESHOLDS

    att_res = calculate_sub_score('attendance', student_data.get('attendance_pct'))
    marks_res = calculate_sub_score('marks', student_data.get('avg_marks'))
    cgpa_res = calculate_sub_score('cgpa', student_data.get('cgpa'))
    assign_res = calculate_sub_score('assignment', student_data.get('assignment_completion_pct'))
    trend_res = calculate_sub_score('trend', student_data.get('cgpa'), student_data.get('backlogs', 0))

    w_att = t.get('attendance_weight', 0.30)
    w_marks = t.get('marks_weight', 0.25)
    w_cgpa = t.get('cgpa_weight', 0.25)
    w_assign = t.get('assignment_weight', 0.15)
    w_trend = t.get('trend_weight', 0.05)

    total_weight = w_att + w_marks + w_cgpa + w_assign + w_trend or 1.0

    factors = [
        {
            'name': 'Class Attendance',
            'raw_value': student_data.get('attendance_pct', 0.0),
            'raw_unit': '%',
            'sub_score': att_res['score'],
            'weight': round(w_att / total_weight, 2),
            'weighted_points': round(att_res['score'] * (w_att / total_weight), 1),
            'status': att_res['status'],
            'summary': att_res['summary'],
        },
        {
            'name': 'Assessment Marks',
            'raw_value': student_data.get('avg_marks', 0.0),
            'raw_unit': '%',
            'sub_score': marks_res['score'],
            'weight': round(w_marks / total_weight, 2),
            'weighted_points': round(marks_res['score'] * (w_marks / total_weight), 1),
            'status': marks_res['status'],
            'summary': marks_res['summary'],
        },
        {
            'name': 'Cumulative CGPA',
            'raw_value': student_data.get('cgpa', 0.0),
            'raw_unit': ' / 10',
            'sub_score': cgpa_res['score'],
            'weight': round(w_cgpa / total_weight, 2),
            'weighted_points': round(cgpa_res['score'] * (w_cgpa / total_weight), 1),
            'status': cgpa_res['status'],
            'summary': cgpa_res['summary'],
        },
        {
            'name': 'Assignment Submissions',
            'raw_value': student_data.get('assignment_completion_pct', 0.0),
            'raw_unit': '%',
            'sub_score': assign_res['score'],
            'weight': round(w_assign / total_weight, 2),
            'weighted_points': round(assign_res['score'] * (w_assign / total_weight), 1),
            'status': assign_res['status'],
            'summary': assign_res['summary'],
        },
        {
            'name': 'Backlogs & Momentum',
            'raw_value': student_data.get('backlogs', 0),
            'raw_unit': ' arrears',
            'sub_score': trend_res['score'],
            'weight': round(w_trend / total_weight, 2),
            'weighted_points': round(trend_res['score'] * (w_trend / total_weight), 1),
            'status': trend_res['status'],
            'summary': trend_res['summary'],
        },
    ]

    total_score = round(sum(f['weighted_points'] for f in factors))
    total_score = max(0, min(100, total_score))

    low_th = t.get('low_threshold', 40.0)
    high_th = t.get('high_threshold', 70.0)

    if total_score >= high_th:
        category = 'High'
        explanation = f"Flagged for High Academic Support risk (Score: {total_score}/100). Needs immediate faculty advising and attendance audit."
    elif total_score >= low_th:
        category = 'Moderate'
        explanation = f"Moderate Risk status (Score: {total_score}/100). Demonstrates early warning signs in coursework or attendance."
    else:
        category = 'Low'
        explanation = f"Low Academic Risk (Score: {total_score}/100). Consistently meeting department benchmarks."

    return {
        'student_id': student_data.get('student_id', ''),
        'risk_score': total_score,
        'risk_category': category,
        'factors': factors,
        'explanation': explanation,
        'disclaimer': 'NOVA Screening Assessment: Screening estimate for academic guidance, not a guaranteed prediction of failure.'
    }
