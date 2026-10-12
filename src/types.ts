export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  academic_year: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  enrollment_date: string;
  status: 'Active' | 'On Leave' | 'Graduated';
  avatar?: string;
  // Computed / joined fields:
  cgpa: number;
  attendance_pct: number;
  avg_marks: number;
  assignment_completion_pct: number;
  backlogs: number;
  prev_semester_gpa: number;
  risk_score: number;
  risk_category: 'Low' | 'Moderate' | 'High';
}

export interface AcademicRecord {
  id: number;
  student_id: string;
  cgpa: number;
  attendance_pct: number;
  avg_marks: number;
  assignment_completion_pct: number;
  backlogs: number;
  prev_semester_gpa: number;
  updated_at: string;
}

export interface SubjectPerformance {
  id: number;
  student_id: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  attendance_pct: number;
}

export interface FactorContribution {
  name: string;
  raw_value: number;
  raw_unit: string;
  sub_score: number; // 0 to 100
  weight: number; // e.g. 0.30
  weighted_points: number; // sub_score * weight
  status: 'Good' | 'Moderate' | 'Critical';
  summary: string;
}

export interface RiskAnalysis {
  student_id: string;
  student_name: string;
  risk_score: number;
  risk_category: 'Low' | 'Moderate' | 'High';
  factors: FactorContribution[];
  explanation: string;
  key_concerns: string[];
  positive_factors: string[];
  calculated_at: string;
  disclaimer: string;
}

export interface Recommendation {
  id: number;
  student_id: string;
  issue: string;
  explanation: string;
  recommended_action: string;
  priority: 'High' | 'Medium' | 'Low';
  suggested_review_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
}

export interface FollowUpNote {
  id: number;
  intervention_id: number;
  note: string;
  author: string;
  created_at: string;
}

export interface Intervention {
  id: number;
  student_id: string;
  student_name?: string;
  department?: string;
  mentor_name: string;
  mentor_email: string;
  issue: string;
  planned_action: string;
  priority: 'High' | 'Medium' | 'Low';
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  outcome?: string;
  created_at: string;
  updated_at: string;
  notes?: FollowUpNote[];
  cgpa_before?: number;
  attendance_before?: number;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface ThresholdSettings {
  low_threshold: number; // default 40 (0-39 Low)
  high_threshold: number; // default 70 (70-100 High)
  attendance_weight: number; // 0.30
  marks_weight: number; // 0.25
  cgpa_weight: number; // 0.25
  assignment_weight: number; // 0.15
  trend_weight: number; // 0.05
}

export interface SimulationResult {
  current_risk: RiskAnalysis;
  simulated_risk: RiskAnalysis;
  score_difference: number;
  impact_summary: string;
  changed_factors: {
    factor: string;
    current: number;
    simulated: number;
    difference: number;
    unit: string;
  }[];
  suggested_next_steps: string[];
}

export interface DashboardData {
  summary: {
    total_students: number;
    avg_cgpa: number;
    avg_attendance: number;
    needing_support: number;
    performing_well: number;
    pending_interventions: number;
  };
  charts: {
    performance_distribution: { label: string; count: number }[];
    attendance_vs_marks: { student_id: string; name: string; attendance: number; marks: number; risk: string }[];
    department_performance: { department: string; avg_cgpa: number; avg_attendance: number; student_count: number }[];
    monthly_trends: { month: string; avg_marks: number; avg_attendance: number }[];
    risk_distribution: { category: string; count: number; percentage: number }[];
  };
  recent_activities: {
    id: string;
    type: 'intervention' | 'record_update' | 'risk_flag';
    description: string;
    timestamp: string;
    actor: string;
  }[];
  critical_alerts: {
    id: string;
    student_id: string;
    student_name: string;
    department: string;
    issue: string;
    risk_score: number;
  }[];
}
