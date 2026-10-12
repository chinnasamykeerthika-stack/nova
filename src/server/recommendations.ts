import { Recommendation, SubjectPerformance } from '../types.ts';
import { StudentMetricsInput } from './analytics.ts';

export function generatePersonalizedRecommendations(
  student: StudentMetricsInput,
  subjects: Array<Partial<SubjectPerformance> & { marks_obtained: number; max_marks: number; subject_code: string; subject_name: string }> = []
): Omit<Recommendation, 'id'>[] {
  const recommendations: Omit<Recommendation, 'id'>[] = [];
  const now = new Date();

  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const attendance = student.attendance_pct ?? 100;
  const marks = student.avg_marks ?? 100;
  const gpa = student.cgpa ?? 10.0;
  const assignment = student.assignment_completion_pct ?? 100;
  const backlogs = student.backlogs ?? 0;
  const prevGpa = student.prev_semester_gpa ?? gpa;

  // 1. Attendance Action Plan
  if (attendance < 65) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Critical Attendance Deficit (<65%)',
      explanation: `Student's attendance is currently ${attendance.toFixed(1)}%, well below the university mandatory 75% examination eligibility minimum. At immediate risk of course debarment.`,
      recommended_action: 'Issue formal attendance advisory letter, schedule mandatory parent-mentor conference, and implement a daily lecture check-in card for the next 4 weeks.',
      priority: 'High',
      suggested_review_date: addDays(7),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  } else if (attendance < 75) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Attendance Below Cutoff (65-74%)',
      explanation: `Student attendance is ${attendance.toFixed(1)}%. Missing just 2-3 more lab or lecture hours will cause mandatory semester debarment.`,
      recommended_action: 'Establish bi-weekly attendance audit with department proctor and require medical/valid leaves documentation verification.',
      priority: 'Medium',
      suggested_review_date: addDays(14),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  }

  // 2. Specific Subject Deficits (if subjects provided)
  const lowSubjects = subjects.filter((s) => s.marks_obtained < 50);
  if (lowSubjects.length > 0) {
    const subjectNames = lowSubjects.map((s) => `${s.subject_name} (${s.marks_obtained}/${s.max_marks})`).join(', ');
    recommendations.push({
      student_id: student.student_id,
      issue: `Critical Subject Remediation Needed: ${lowSubjects.map((s) => s.subject_code).join(', ')}`,
      explanation: `Student scored below passing mark in ${lowSubjects.length} subject(s): ${subjectNames}.`,
      recommended_action: `Enroll student in Saturday remedial clinic for ${lowSubjects.map((s) => s.subject_code).join(', ')}, assign a peer tutor, and provide 3 solved past-year question paper modules.`,
      priority: 'High',
      suggested_review_date: addDays(10),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  } else if (marks < 60) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Sub-Optimal Assessment Average (<60%)',
      explanation: `Internal evaluation marks average is ${marks.toFixed(1)}%, putting overall semester grade classification into third-division bracket.`,
      recommended_action: 'Arrange a 1-on-1 faculty conceptual clearance session focusing on foundational problem-solving and provide curated question banks for midterm preparation.',
      priority: 'High',
      suggested_review_date: addDays(14),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  }

  // 3. Incomplete Assignments
  if (assignment < 70) {
    recommendations.push({
      student_id: student.student_id,
      issue: `Coursework Delinquency (${assignment.toFixed(1)}% submitted)`,
      explanation: `Student has skipped or missed crucial lab journals and problem sets. Continuous internal assessment (CIA) marks will be severely penalised.`,
      recommended_action: 'Grant a structured 10-day extension window to submit past due assignment sheets under lab instructor supervision with partial credit recovery.',
      priority: 'Medium',
      suggested_review_date: addDays(10),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  }

  // 4. Declining Academic Performance or Backlogs
  if (backlogs > 0) {
    recommendations.push({
      student_id: student.student_id,
      issue: `Active Arrears / Backlogs (${backlogs} course${backlogs > 1 ? 's' : ''})`,
      explanation: `Student has ${backlogs} uncleared prior semester paper(s), risking delayed degree completion and disqualification from campus placement drives.`,
      recommended_action: 'Formulate a supplementary exam study schedule, map prerequisite dependencies, and conduct bi-weekly mock tests prior to university backlog examinations.',
      priority: 'High',
      suggested_review_date: addDays(21),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  } else if (prevGpa - gpa >= 0.7) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Academic Momentum Drop (GPA down by ' + (prevGpa - gpa).toFixed(2) + ')',
      explanation: `Student GPA declined from ${prevGpa.toFixed(2)} to ${gpa.toFixed(2)}. Indicates recent external stressors, loss of study routine, or difficulty with current semester advanced electives.`,
      recommended_action: 'Convene an empathetic faculty mentoring check-in to identify potential personal, health, or academic adjustment hurdles and adjust elective workload if feasible.',
      priority: 'Medium',
      suggested_review_date: addDays(14),
      status: 'Pending',
      created_at: now.toISOString(),
    });
  }

  // 5. High Performer Enrichment (Consistent Excellence)
  if (gpa >= 8.5 && attendance >= 85 && marks >= 80) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Honor Roll / Advanced Growth Track',
      explanation: `Student demonstrates outstanding mastery (CGPA: ${gpa.toFixed(2)}, Attendance: ${attendance.toFixed(1)}%, Marks: ${marks.toFixed(1)}%). Ready for academic acceleration.`,
      recommended_action: 'Nominate student for department research assistantship, recommend participation in hackathons/symposiums, and appoint as peer tutor mentor.',
      priority: 'Low',
      suggested_review_date: addDays(30),
      status: 'In Progress',
      created_at: now.toISOString(),
    });
  }

  // Fallback if student is generally fine but has moderate points
  if (recommendations.length === 0) {
    recommendations.push({
      student_id: student.student_id,
      issue: 'Routine Progress Maintenance',
      explanation: `Student is in stable standing across all operational criteria with CGPA of ${gpa.toFixed(2)}.`,
      recommended_action: 'Conduct regular monthly check-in with class advisor to sustain study habits and explore industry micro-certifications.',
      priority: 'Low',
      suggested_review_date: addDays(30),
      status: 'In Progress',
      created_at: now.toISOString(),
    });
  }

  return recommendations;
}
