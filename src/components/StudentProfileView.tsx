import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  BookOpen,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  PlusCircle,
  Save,
  MessageSquare,
  FileCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Student, SubjectPerformance, Recommendation, Intervention, RiskAnalysis } from '../types.ts';

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onOpenCreateIntervention: (studentId: string, studentName: string) => void;
  onOpenSimulate: (student: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onOpenCreateIntervention,
  onOpenSimulate,
  showToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    student: Student;
    subjects: SubjectPerformance[];
    recommendations: Recommendation[];
    interventions: Intervention[];
    risk_analysis: RiskAnalysis;
  } | null>(null);

  // Edit Academic Record form state
  const [cgpaInput, setCgpaInput] = useState('');
  const [attInput, setAttInput] = useState('');
  const [marksInput, setMarksInput] = useState('');
  const [assignInput, setAssignInput] = useState('');
  const [backlogsInput, setBacklogsInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Follow-up note input state for interventions
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [submittingNote, setSubmittingNote] = useState<number | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setCgpaInput(data.student.cgpa.toString());
        setAttInput(data.student.attendance_pct.toString());
        setMarksInput(data.student.avg_marks.toString());
        setAssignInput(data.student.assignment_completion_pct.toString());
        setBacklogsInput(data.student.backlogs.toString());
      } else {
        showToast('Failed to load student profile', 'error');
      }
    } catch (e: any) {
      showToast('Network error loading student profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/students/${profile.student.student_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cgpa: parseFloat(cgpaInput),
          attendance_pct: parseFloat(attInput),
          avg_marks: parseFloat(marksInput),
          assignment_completion_pct: parseFloat(assignInput),
          backlogs: parseInt(backlogsInput, 10),
        }),
      });

      if (res.ok) {
        showToast('Academic metrics updated! Risk analytics recalculated.', 'success');
        await fetchProfile();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update record', 'error');
      }
    } catch (e: any) {
      showToast('Error saving record', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (interventionId: number) => {
    const text = (noteInputs[interventionId] || '').trim();
    if (!text) return;
    setSubmittingNote(interventionId);

    try {
      const res = await fetch(`/api/interventions/${interventionId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text, author: 'Dr. Aris Thorne (Faculty)' }),
      });

      if (res.ok) {
        showToast('Follow-up note logged', 'success');
        setNoteInputs((prev) => ({ ...prev, [interventionId]: '' }));
        await fetchProfile();
      } else {
        showToast('Failed to add note', 'error');
      }
    } catch (e) {
      showToast('Error logging note', 'error');
    } finally {
      setSubmittingNote(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-12 text-center">
        <div className="w-9 h-9 border-3 border-[#7965E8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3">Loading student profile & risk factors...</p>
      </div>
    );
  }

  const { student, subjects, recommendations, interventions, risk_analysis } = profile;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSimulate(student)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7965E8]" />
            <span>Simulate What-If</span>
          </button>
          <button
            onClick={() => onOpenCreateIntervention(student.student_id, student.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Faculty Intervention</span>
          </button>
        </div>
      </div>

      {/* Hero Student Banner Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center font-bold text-xl shrink-0">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#202747]">{student.name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {student.student_id}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    student.risk_category === 'High'
                      ? 'bg-rose-100 text-rose-700'
                      : student.risk_category === 'Moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {student.risk_category} Risk ({risk_analysis.risk_score}/100)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                <span>{student.department}</span>
                <span>·</span>
                <span>Year {student.academic_year}, Semester {student.semester}</span>
                <span>·</span>
                <span>{student.email}</span>
                <span>·</span>
                <span>Enrolled: {student.enrollment_date}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cluster */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center shrink-0">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">CGPA</p>
              <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{student.cgpa.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Attendance</p>
              <p className={`text-base font-bold font-mono tabular-nums ${student.attendance_pct < 75 ? 'text-rose-600' : 'text-slate-900'}`}>
                {student.attendance_pct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Avg Marks</p>
              <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{student.avg_marks.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Backlogs</p>
              <p className={`text-base font-bold font-mono tabular-nums ${student.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {student.backlogs}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Core View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Explainable AI Risk Score & Factor Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#7965E8]" />
                <h2 className="text-sm font-bold text-slate-900">Explainable AI Risk Profile</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">
                {risk_analysis.risk_score} / 100
              </span>
            </div>

            {/* Overall Score Dial / Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Support Risk Score</span>
                <span className="font-bold text-slate-900">{risk_analysis.risk_score}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    risk_analysis.risk_category === 'High'
                      ? 'bg-rose-500'
                      : risk_analysis.risk_category === 'Moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, risk_analysis.risk_score))}%` }}
                />
              </div>
            </div>

            {/* Plain-Language Explanation */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">Diagnosis Summary:</p>
              <p>{risk_analysis.explanation}</p>
            </div>

            {/* Factor Contribution Progress Bars */}
            <div className="mt-5 space-y-3.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Factor Contribution Breakdown
              </p>
              {risk_analysis.factors.map((factor) => (
                <div key={factor.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{factor.name}</span>
                    <span className="font-mono text-slate-500">
                      +{factor.weighted_points} pts ({(factor.weight * 100).toFixed(0)}% wt)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        factor.status === 'Critical'
                          ? 'bg-rose-500'
                          : factor.status === 'Moderate'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, factor.sub_score))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{factor.summary}</p>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-snug">
              {risk_analysis.disclaimer}
            </p>
          </div>

          {/* Form to Update Academic Records & Recalculate */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Update Academic Records</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter latest assessment figures. Saves to SQLite and recalculates risk in real time.
            </p>

            <form onSubmit={handleUpdateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Attendance %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={attInput}
                    onChange={(e) => setAttInput(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Average Marks %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={marksInput}
                    onChange={(e) => setMarksInput(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Assignment %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={assignInput}
                    onChange={(e) => setAssignInput(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Active Backlogs (Arrears)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={backlogsInput}
                  onChange={(e) => setBacklogsInput(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#7965E8]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Recalculating...' : 'Save & Recalculate Risk'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Subjects, Recommendations, Interventions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject-Wise Performance */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Course & Subject Breakdown</h2>
            <p className="text-xs text-slate-500 mb-4">
              Current semester enrollment performance and individual attendance tracking.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Subject Code</th>
                    <th className="py-2.5 px-3">Subject Title</th>
                    <th className="py-2.5 px-2 text-center">Credits</th>
                    <th className="py-2.5 px-3 text-right">Marks (Max 100)</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-right">Subject Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No individual course subjects enrolled yet.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{sub.subject_code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{sub.subject_name}</td>
                        <td className="py-2.5 px-2 text-center text-slate-600">{sub.credits}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                          <span className={sub.marks_obtained < 50 ? 'text-rose-600 font-bold' : ''}>
                            {sub.marks_obtained}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            sub.grade === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <span className={`font-mono ${sub.attendance_pct < 75 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {sub.attendance_pct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Personalized Success Recommendations */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Personalized Improvement Tasks</h2>
                <p className="text-xs text-slate-500">Automated, data-driven prescriptions derived from actual performance</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-[#E9E3FF] text-[#7965E8] font-semibold">
                {recommendations.length} Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mr-2 ${
                        rec.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <strong className="text-xs text-slate-900 font-bold">{rec.issue}</strong>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: {rec.suggested_review_date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{rec.explanation}</p>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs">
                    <p className="font-semibold text-slate-800">Action Plan:</p>
                    <p className="text-slate-600 mt-0.5">{rec.recommended_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Interventions & Notes */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Faculty Intervention Logs</h2>
                <p className="text-xs text-slate-500">Mentorship history, action milestones, and follow-up notes</p>
              </div>
              <button
                onClick={() => onOpenCreateIntervention(student.student_id, student.name)}
                className="text-xs font-semibold text-[#7965E8] hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Log</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {interventions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No interventions logged for this student yet. Click "Create Faculty Intervention" to begin.
                </div>
              ) : (
                interventions.map((inter) => (
                  <div key={inter.id} className="p-4 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{inter.issue}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inter.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inter.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inter.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Assigned Mentor: <strong>{inter.mentor_name}</strong> · Due: {inter.due_date}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Planned Action:</strong> {inter.planned_action}
                    </div>

                    {inter.outcome && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <strong>Outcome Recorded:</strong> {inter.outcome}
                      </div>
                    )}

                    {/* Follow-Up Notes Timeline */}
                    {inter.notes && inter.notes.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Follow-up Notes:</p>
                        {inter.notes.map((note) => (
                          <div key={note.id} className="p-2 rounded bg-slate-50 text-xs text-slate-600">
                            <p>{note.note}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">
                              — {note.author} · {new Date(note.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note quick inline input */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add quick follow-up observation note..."
                        value={noteInputs[inter.id] || ''}
                        onChange={(e) =>
                          setNoteInputs((prev) => ({ ...prev, [inter.id]: e.target.value }))
                        }
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#7965E8]"
                      />
                      <button
                        onClick={() => handleAddNote(inter.id)}
                        disabled={submittingNote === inter.id || !(noteInputs[inter.id] || '').trim()}
                        className="px-3 py-1.5 text-xs font-semibold text-[#7965E8] bg-[#E9E3FF] hover:bg-[#ded6ff] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submittingNote === inter.id ? 'Adding...' : 'Post Note'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
