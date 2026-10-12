import React, { useState } from 'react';
import { X, AlertTriangle, UserPlus, Edit3, ClipboardList, Trash2 } from 'lucide-react';
import { Student, Faculty } from '../types.ts';

// 1. ADD STUDENT MODAL
interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [cgpa, setCgpa] = useState('7.50');
  const [attendance, setAttendance] = useState('80.0');
  const [marks, setMarks] = useState('70.0');
  const [assignment, setAssignment] = useState('85.0');
  const [backlogs, setBacklogs] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        student_id: studentId.trim(),
        name: name.trim(),
        email: email.trim(),
        department,
        academic_year: parseInt(year, 10),
        semester: parseInt(semester, 10),
        cgpa: parseFloat(cgpa),
        attendance_pct: parseFloat(attendance),
        avg_marks: parseFloat(marks),
        assignment_completion_pct: parseFloat(assignment),
        backlogs: parseInt(backlogs, 10),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#7965E8]" />
            <h2 className="text-base font-bold text-slate-900">Add New Student Record</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Roll ID *</label>
              <input
                type="text"
                placeholder="e.g. STU-2024-099"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rachel Adams"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              placeholder="e.g. rachel.adams@student.nova.edu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Data Science">Data Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester (1-8)</label>
              <input
                type="number"
                min="1"
                max="8"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
            <p className="font-bold text-slate-800">Initial Academic Metrics</p>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-600 mb-0.5">CGPA (0-10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Attendance %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Avg Marks %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-600 mb-0.5">Assignment %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Backlogs</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={backlogs}
                  onChange={(e) => setBacklogs(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register Student & Compute Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. EDIT STUDENT MODAL
interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (student) {
      setName(student.name);
      setEmail(student.email);
      setDepartment(student.department);
      setYear(student.academic_year);
      setSemester(student.semester);
      setStatus(student.status);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(student.student_id, {
        name,
        email,
        department,
        academic_year: year,
        semester,
        status,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#7965E8]" />
            <h2 className="text-base font-bold text-slate-900">Edit Student: {student.student_id}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Data Science">Data Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year</label>
              <input
                type="number"
                min="1"
                max="4"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg shadow-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. DELETE CONFIRMATION MODAL
interface DeleteConfirmModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !student) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Delete Student Record?</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Are you sure you want to delete <strong>{student.name} ({student.student_id})</strong>? This will permanently remove all associated academic records, recommendations, and interventions from SQLite.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Yes, Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. CREATE FACULTY INTERVENTION MODAL
interface CreateInterventionModalProps {
  isOpen: boolean;
  initialStudentId?: string;
  initialStudentName?: string;
  students: Student[];
  faculty: Faculty[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateInterventionModal: React.FC<CreateInterventionModalProps> = ({
  isOpen,
  initialStudentId,
  initialStudentName,
  students,
  faculty,
  onClose,
  onSubmit,
}) => {
  const [studentId, setStudentId] = useState(initialStudentId || (students[0]?.student_id || ''));
  const [mentorName, setMentorName] = useState(faculty[0]?.name || 'Dr. Aris Thorne');
  const [mentorEmail, setMentorEmail] = useState(faculty[0]?.email || 'a.thorne@nova.edu');
  const [issue, setIssue] = useState('');
  const [action, setAction] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialStudentId) setStudentId(initialStudentId);
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    setDueDate(twoWeeks.toISOString().split('T')[0]);
  }, [initialStudentId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        student_id: studentId,
        mentor_name: mentorName,
        mentor_email: mentorEmail,
        issue,
        planned_action: action,
        priority,
        due_date: dueDate,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#7965E8]" />
            <h2 className="text-base font-bold text-slate-900">Initiate Faculty Intervention</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Student *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name} ({s.student_id}) · {s.department} · {s.risk_category} Risk
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Faculty Mentor *</label>
              <select
                value={mentorName}
                onChange={(e) => {
                  setMentorName(e.target.value);
                  const f = faculty.find((fac) => fac.name === e.target.value);
                  if (f) setMentorEmail(f.email);
                }}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="High">High Priority (Immediate)</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Identified Academic Issue *</label>
            <input
              type="text"
              placeholder="e.g. Absenteeism below 65% & failing midterm 1"
              required
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Planned Faculty Action & Milestones *</label>
            <textarea
              rows={3}
              placeholder="e.g. Schedule 1-on-1 diagnostic advising, setup weekly peer tutor log, and issue formal warning."
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Review Target Deadline *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg shadow-xs disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Log & Assign Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
