export interface SeedStudentData {
  student_id: string;
  name: string;
  email: string;
  department: string;
  academic_year: number;
  semester: number;
  enrollment_date: string;
  status: 'Active' | 'On Leave' | 'Graduated';
  record: {
    cgpa: number;
    attendance_pct: number;
    avg_marks: number;
    assignment_completion_pct: number;
    backlogs: number;
    prev_semester_gpa: number;
  };
  subjects: {
    subject_code: string;
    subject_name: string;
    credits: number;
    marks_obtained: number;
    max_marks: number;
    grade: string;
    attendance_pct: number;
  }[];
}

export const SEED_FACULTY = [
  { name: 'Dr. Aris Thorne', email: 'a.thorne@nova.edu', department: 'Computer Science', role: 'Professor & Dean' },
  { name: 'Prof. Maya Lin', email: 'm.lin@nova.edu', department: 'Data Science', role: 'Associate Professor & Mentor Lead' },
  { name: 'Dr. David Kalu', email: 'd.kalu@nova.edu', department: 'Electronics & Communication', role: 'Senior Lecturer' },
  { name: 'Prof. Elena Rostova', email: 'e.rostova@nova.edu', department: 'Information Technology', role: 'Academic Advisor' },
  { name: 'Dr. Samuel Vance', email: 's.vance@nova.edu', department: 'Mechanical Engineering', role: 'Student Success Chair' },
];

export const SEED_STUDENTS: SeedStudentData[] = [
  // HIGH RISK STUDENTS (Needing Urgent Support)
  {
    student_id: 'STU-2024-001',
    name: 'Aiden Brooks',
    email: 'aiden.brooks@student.nova.edu',
    department: 'Computer Science',
    academic_year: 3,
    semester: 5,
    enrollment_date: '2023-08-15',
    status: 'Active',
    record: {
      cgpa: 5.62,
      attendance_pct: 61.4,
      avg_marks: 48.5,
      assignment_completion_pct: 52.0,
      backlogs: 2,
      prev_semester_gpa: 6.80,
    },
    subjects: [
      { subject_code: 'CS501', subject_name: 'Database Management Systems', credits: 4, marks_obtained: 44, max_marks: 100, grade: 'F', attendance_pct: 58 },
      { subject_code: 'CS502', subject_name: 'Design & Analysis of Algorithms', credits: 4, marks_obtained: 52, max_marks: 100, grade: 'D', attendance_pct: 63 },
      { subject_code: 'CS503', subject_name: 'Operating Systems Principles', credits: 3, marks_obtained: 47, max_marks: 100, grade: 'F', attendance_pct: 60 },
      { subject_code: 'CS504', subject_name: 'Software Engineering & Agile', credits: 3, marks_obtained: 51, max_marks: 100, grade: 'D', attendance_pct: 65 },
    ],
  },
  {
    student_id: 'STU-2024-002',
    name: 'Zoe Morales',
    email: 'zoe.morales@student.nova.edu',
    department: 'Electronics & Communication',
    academic_year: 2,
    semester: 3,
    enrollment_date: '2024-08-12',
    status: 'Active',
    record: {
      cgpa: 5.85,
      attendance_pct: 64.0,
      avg_marks: 52.0,
      assignment_completion_pct: 58.0,
      backlogs: 1,
      prev_semester_gpa: 6.90,
    },
    subjects: [
      { subject_code: 'EC301', subject_name: 'Signals & Systems', credits: 4, marks_obtained: 46, max_marks: 100, grade: 'F', attendance_pct: 60 },
      { subject_code: 'EC302', subject_name: 'Analog Electronic Circuits', credits: 4, marks_obtained: 54, max_marks: 100, grade: 'D', attendance_pct: 66 },
      { subject_code: 'EC303', subject_name: 'Digital Logic Design', credits: 3, marks_obtained: 56, max_marks: 100, grade: 'C', attendance_pct: 68 },
    ],
  },
  {
    student_id: 'STU-2024-003',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@student.nova.edu',
    department: 'Data Science',
    academic_year: 4,
    semester: 7,
    enrollment_date: '2022-08-10',
    status: 'Active',
    record: {
      cgpa: 5.40,
      attendance_pct: 59.2,
      avg_marks: 46.0,
      assignment_completion_pct: 45.0,
      backlogs: 3,
      prev_semester_gpa: 6.20,
    },
    subjects: [
      { subject_code: 'DS701', subject_name: 'Deep Learning & Neural Nets', credits: 4, marks_obtained: 42, max_marks: 100, grade: 'F', attendance_pct: 55 },
      { subject_code: 'DS702', subject_name: 'Big Data Distributed Systems', credits: 4, marks_obtained: 48, max_marks: 100, grade: 'F', attendance_pct: 61 },
      { subject_code: 'DS703', subject_name: 'Data Privacy & Ethics', credits: 3, marks_obtained: 48, max_marks: 100, grade: 'D', attendance_pct: 62 },
    ],
  },

  // MODERATE RISK STUDENTS (Warning Signs)
  {
    student_id: 'STU-2024-004',
    name: 'Liam Chen',
    email: 'liam.chen@student.nova.edu',
    department: 'Computer Science',
    academic_year: 2,
    semester: 4,
    enrollment_date: '2024-08-12',
    status: 'Active',
    record: {
      cgpa: 6.84,
      attendance_pct: 73.5,
      avg_marks: 64.2,
      assignment_completion_pct: 76.0,
      backlogs: 0,
      prev_semester_gpa: 7.30,
    },
    subjects: [
      { subject_code: 'CS401', subject_name: 'Discrete Mathematics', credits: 4, marks_obtained: 60, max_marks: 100, grade: 'C', attendance_pct: 71 },
      { subject_code: 'CS402', subject_name: 'Computer Organization & Architecture', credits: 4, marks_obtained: 68, max_marks: 100, grade: 'B', attendance_pct: 75 },
      { subject_code: 'CS403', subject_name: 'Java & Object Oriented Programming', credits: 3, marks_obtained: 65, max_marks: 100, grade: 'B', attendance_pct: 74 },
    ],
  },
  {
    student_id: 'STU-2024-005',
    name: 'Chloe Bennett',
    email: 'chloe.bennett@student.nova.edu',
    department: 'Information Technology',
    academic_year: 3,
    semester: 6,
    enrollment_date: '2023-08-15',
    status: 'Active',
    record: {
      cgpa: 6.95,
      attendance_pct: 74.0,
      avg_marks: 66.8,
      assignment_completion_pct: 78.0,
      backlogs: 0,
      prev_semester_gpa: 7.10,
    },
    subjects: [
      { subject_code: 'IT601', subject_name: 'Computer Networks & Security', credits: 4, marks_obtained: 64, max_marks: 100, grade: 'B', attendance_pct: 72 },
      { subject_code: 'IT602', subject_name: 'Web Engineering & Cloud', credits: 3, marks_obtained: 70, max_marks: 100, grade: 'A', attendance_pct: 76 },
    ],
  },
  {
    student_id: 'STU-2024-006',
    name: 'Devon Park',
    email: 'devon.park@student.nova.edu',
    department: 'Mechanical Engineering',
    academic_year: 3,
    semester: 5,
    enrollment_date: '2023-08-15',
    status: 'Active',
    record: {
      cgpa: 6.42,
      attendance_pct: 77.0,
      avg_marks: 61.5,
      assignment_completion_pct: 68.0,
      backlogs: 1,
      prev_semester_gpa: 6.70,
    },
    subjects: [
      { subject_code: 'ME501', subject_name: 'Thermodynamics & Heat Transfer', credits: 4, marks_obtained: 56, max_marks: 100, grade: 'C', attendance_pct: 75 },
      { subject_code: 'ME502', subject_name: 'Fluid Mechanics & Turbomachinery', credits: 4, marks_obtained: 67, max_marks: 100, grade: 'B', attendance_pct: 79 },
    ],
  },

  // LOW RISK STUDENTS (Performing Well & Exemplary)
  {
    student_id: 'STU-2024-007',
    name: 'Sophia Patel',
    email: 'sophia.patel@student.nova.edu',
    department: 'Computer Science',
    academic_year: 3,
    semester: 5,
    enrollment_date: '2023-08-15',
    status: 'Active',
    record: {
      cgpa: 9.24,
      attendance_pct: 95.8,
      avg_marks: 91.2,
      assignment_completion_pct: 98.0,
      backlogs: 0,
      prev_semester_gpa: 9.15,
    },
    subjects: [
      { subject_code: 'CS501', subject_name: 'Database Management Systems', credits: 4, marks_obtained: 94, max_marks: 100, grade: 'O', attendance_pct: 98 },
      { subject_code: 'CS502', subject_name: 'Design & Analysis of Algorithms', credits: 4, marks_obtained: 88, max_marks: 100, grade: 'A+', attendance_pct: 94 },
      { subject_code: 'CS503', subject_name: 'Operating Systems Principles', credits: 3, marks_obtained: 92, max_marks: 100, grade: 'O', attendance_pct: 96 },
    ],
  },
  {
    student_id: 'STU-2024-008',
    name: 'Marcus Washington',
    email: 'marcus.w@student.nova.edu',
    department: 'Data Science',
    academic_year: 2,
    semester: 3,
    enrollment_date: '2024-08-12',
    status: 'Active',
    record: {
      cgpa: 8.78,
      attendance_pct: 92.4,
      avg_marks: 86.5,
      assignment_completion_pct: 95.0,
      backlogs: 0,
      prev_semester_gpa: 8.60,
    },
    subjects: [
      { subject_code: 'DS301', subject_name: 'Statistical Modeling & Inference', credits: 4, marks_obtained: 89, max_marks: 100, grade: 'A+', attendance_pct: 94 },
      { subject_code: 'DS302', subject_name: 'Data Structures in Python', credits: 4, marks_obtained: 84, max_marks: 100, grade: 'A', attendance_pct: 91 },
    ],
  },
  {
    student_id: 'STU-2024-009',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@student.nova.edu',
    department: 'Electronics & Communication',
    academic_year: 4,
    semester: 7,
    enrollment_date: '2022-08-10',
    status: 'Active',
    record: {
      cgpa: 8.92,
      attendance_pct: 94.0,
      avg_marks: 88.0,
      assignment_completion_pct: 96.0,
      backlogs: 0,
      prev_semester_gpa: 8.85,
    },
    subjects: [
      { subject_code: 'EC701', subject_name: 'VLSI Circuit Design', credits: 4, marks_obtained: 90, max_marks: 100, grade: 'O', attendance_pct: 96 },
      { subject_code: 'EC702', subject_name: 'Wireless & Mobile Communications', credits: 4, marks_obtained: 86, max_marks: 100, grade: 'A', attendance_pct: 92 },
    ],
  },
  {
    student_id: 'STU-2024-010',
    name: 'Ethan O\'Connor',
    email: 'ethan.oc@student.nova.edu',
    department: 'Mechanical Engineering',
    academic_year: 1,
    semester: 2,
    enrollment_date: '2025-08-20',
    status: 'Active',
    record: {
      cgpa: 7.82,
      attendance_pct: 88.5,
      avg_marks: 78.4,
      assignment_completion_pct: 89.0,
      backlogs: 0,
      prev_semester_gpa: 7.75,
    },
    subjects: [
      { subject_code: 'ME201', subject_name: 'Engineering Mechanics', credits: 4, marks_obtained: 80, max_marks: 100, grade: 'A', attendance_pct: 90 },
      { subject_code: 'ME202', subject_name: 'Material Science', credits: 3, marks_obtained: 77, max_marks: 100, grade: 'B+', attendance_pct: 87 },
    ],
  },
  {
    student_id: 'STU-2024-011',
    name: 'Fatima Zahra',
    email: 'fatima.z@student.nova.edu',
    department: 'Information Technology',
    academic_year: 4,
    semester: 8,
    enrollment_date: '2022-08-10',
    status: 'Active',
    record: {
      cgpa: 8.45,
      attendance_pct: 90.0,
      avg_marks: 82.5,
      assignment_completion_pct: 92.0,
      backlogs: 0,
      prev_semester_gpa: 8.35,
    },
    subjects: [
      { subject_code: 'IT801', subject_name: 'Cybersecurity Threat Intelligence', credits: 4, marks_obtained: 85, max_marks: 100, grade: 'A', attendance_pct: 91 },
      { subject_code: 'IT802', subject_name: 'Enterprise Cloud Architectures', credits: 3, marks_obtained: 80, max_marks: 100, grade: 'A', attendance_pct: 89 },
    ],
  },
  {
    student_id: 'STU-2024-012',
    name: 'Julian Navarro',
    email: 'julian.n@student.nova.edu',
    department: 'Computer Science',
    academic_year: 1,
    semester: 1,
    enrollment_date: '2025-08-20',
    status: 'Active',
    record: {
      cgpa: 6.15,
      attendance_pct: 69.8,
      avg_marks: 58.0,
      assignment_completion_pct: 64.0,
      backlogs: 1,
      prev_semester_gpa: 6.40,
    },
    subjects: [
      { subject_code: 'CS101', subject_name: 'Introduction to Programming in C', credits: 4, marks_obtained: 55, max_marks: 100, grade: 'C', attendance_pct: 68 },
      { subject_code: 'CS102', subject_name: 'Engineering Calculus I', credits: 4, marks_obtained: 61, max_marks: 100, grade: 'C', attendance_pct: 71 },
    ],
  },
];

export const INITIAL_INTERVENTIONS = [
  {
    student_id: 'STU-2024-001',
    mentor_name: 'Dr. Aris Thorne',
    mentor_email: 'a.thorne@nova.edu',
    issue: 'Severe Attendance Drop & Failing 2 Core CS Papers',
    planned_action: 'Conduct mandatory 1-on-1 parent-faculty advising conference, setup bi-weekly lab progress logs, and assign peer mentor for Algorithms.',
    priority: 'High' as const,
    due_date: '2026-10-25',
    status: 'In Progress' as const,
    outcome: 'Student attended initial counseling; showed commitment to catch up on OS lab submissions.',
    notes: [
      {
        author: 'Dr. Aris Thorne',
        note: 'Held 30-minute academic triage. Aiden noted prolonged commute and health concerns in early term. Arranged hostel accommodation support inquiry.',
        created_at: '2026-10-08T14:30:00Z',
      },
      {
        author: 'Prof. Maya Lin',
        note: 'Assigned senior student peer mentor (Sophia Patel) for CS502 problem solving sessions twice weekly.',
        created_at: '2026-10-10T11:15:00Z',
      },
    ],
  },
  {
    student_id: 'STU-2024-002',
    mentor_name: 'Dr. David Kalu',
    mentor_email: 'd.kalu@nova.edu',
    issue: 'Analog Circuits Deficit (Failing Grade)',
    planned_action: 'Enroll Zoe into weekend hardware circuit simulation workshop and review lab journal checkpoints every Friday.',
    priority: 'High' as const,
    due_date: '2026-10-28',
    status: 'Pending' as const,
    outcome: '',
    notes: [
      {
        author: 'Dr. David Kalu',
        note: 'Sent advisory notification to Zoe to book office hours slot prior to Midterm test 2.',
        created_at: '2026-10-11T09:00:00Z',
      },
    ],
  },
  {
    student_id: 'STU-2024-004',
    mentor_name: 'Prof. Elena Rostova',
    mentor_email: 'e.rostova@nova.edu',
    issue: 'Attendance borderline warning (73.5%)',
    planned_action: 'Issued formal attendance reminder; scheduled check-in on Discrete Mathematics lab attendance.',
    priority: 'Medium' as const,
    due_date: '2026-10-30',
    status: 'Completed' as const,
    outcome: 'Student recovered attendance to 78% after 2 consecutive weeks of 100% presence.',
    notes: [
      {
        author: 'Prof. Elena Rostova',
        note: 'Student brought medical leave certificate for 3 days missed due to viral flu. Adjusted attendance record accordingly.',
        created_at: '2026-10-05T16:00:00Z',
      },
    ],
  },
];
