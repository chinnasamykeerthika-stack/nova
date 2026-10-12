import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { Student, SimulationResult } from '../types.ts';

interface SimulatorViewProps {
  students: Student[];
  initialStudentId?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  students,
  initialStudentId,
  showToast,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students.length > 0 ? students[0].student_id : '')
  );

  // Simulation input states
  const [simAttendance, setSimAttendance] = useState<number>(75);
  const [simMarks, setSimMarks] = useState<number>(65);
  const [simCgpa, setSimCgpa] = useState<number>(7.0);
  const [simAssignment, setSimAssignment] = useState<number>(80);
  const [simBacklogs, setSimBacklogs] = useState<number>(0);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync state when student is picked or changed
  useEffect(() => {
    const student = students.find((s) => s.student_id === selectedStudentId);
    if (student) {
      setSimAttendance(student.attendance_pct);
      setSimMarks(student.avg_marks);
      setSimCgpa(student.cgpa);
      setSimAssignment(student.assignment_completion_pct);
      setSimBacklogs(student.backlogs);
    }
  }, [selectedStudentId, students]);

  // Run simulation API call
  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          simulated_attendance: simAttendance,
          simulated_marks: simMarks,
          simulated_cgpa: simCgpa,
          simulated_assignment: simAssignment,
          simulated_backlogs: simBacklogs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      } else {
        showToast('Failed to run simulation', 'error');
      }
    } catch (e) {
      showToast('Simulation error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [selectedStudentId, simAttendance, simMarks, simCgpa, simAssignment, simBacklogs]);

  // Reset to original student values
  const handleReset = () => {
    const student = students.find((s) => s.student_id === selectedStudentId);
    if (student) {
      setSimAttendance(student.attendance_pct);
      setSimMarks(student.avg_marks);
      setSimCgpa(student.cgpa);
      setSimAssignment(student.assignment_completion_pct);
      setSimBacklogs(student.backlogs);
      showToast('Hypothetical simulation reset to actual database baseline', 'success');
    }
  };

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202747] tracking-tight">NOVA Academic What-If Simulator</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Model hypothetical academic trajectories, test remedial lift, and evaluate risk reduction pathways.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Simulator Sandbox Notice */}
      <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7965E8] shrink-0" />
          <span>
            <strong>Isolated Sandbox Environment:</strong> Adjusting these sliders tests hypothetical academic projections in memory and does <em>not</em> modify permanent student records in the SQLite database.
          </span>
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Select Student Baseline:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#7965E8]"
          >
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} ({s.student_id}) · {s.department} · {s.risk_category} Risk
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="text-xs text-slate-500">
            Actual Record: <strong className="text-slate-800">CGPA {selectedStudent.cgpa.toFixed(2)}</strong>,{' '}
            <strong className="text-slate-800">Att {selectedStudent.attendance_pct.toFixed(1)}%</strong>,{' '}
            <strong className="text-slate-800">Marks {selectedStudent.avg_marks.toFixed(1)}%</strong>
          </div>
        )}
      </div>

      {/* 2-Column: Left Controls, Right Real-Time Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Hypothetical Levers</h2>
            <span className="text-[11px] font-semibold text-slate-400">Live Adjustment</span>
          </div>

          {/* Slider 1: Attendance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Lecture Attendance %</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {simAttendance.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="0.5"
              value={simAttendance}
              onChange={(e) => setSimAttendance(parseFloat(e.target.value))}
              className="w-full accent-[#7965E8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Debarment risk (40%)</span>
              <span className="text-amber-600 font-bold">Cutoff (75%)</span>
              <span>Exemplary (100%)</span>
            </div>
          </div>

          {/* Slider 2: Average Marks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Average Assessment Marks %</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {simMarks.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="0.5"
              value={simMarks}
              onChange={(e) => setSimMarks(parseFloat(e.target.value))}
              className="w-full accent-[#7965E8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Fail (&lt;50%)</span>
              <span className="text-slate-600">Average (65%)</span>
              <span>Distinction (85%+)</span>
            </div>
          </div>

          {/* Slider 3: CGPA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Cumulative CGPA (0 - 10)</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {simCgpa.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="4.0"
              max="10.0"
              step="0.05"
              value={simCgpa}
              onChange={(e) => setSimCgpa(parseFloat(e.target.value))}
              className="w-full accent-[#7965E8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Probation (4.0)</span>
              <span>Pass (6.0)</span>
              <span>Honors (9.0+)</span>
            </div>
          </div>

          {/* Slider 4: Assignment Completion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Assignment Completion %</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {simAssignment.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="1"
              value={simAssignment}
              onChange={(e) => setSimAssignment(parseFloat(e.target.value))}
              className="w-full accent-[#7965E8]"
            />
          </div>

          {/* Slider 5: Backlogs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Uncleared Arrears / Backlogs</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${simBacklogs === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {simBacklogs} course{simBacklogs !== 1 ? 's' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={simBacklogs}
              onChange={(e) => setSimBacklogs(parseInt(e.target.value, 10))}
              className="w-full accent-[#7965E8]"
            />
          </div>
        </div>

        {/* Right: Real-Time Results & Side-by-Side Impact (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {simResult && (
            <>
              {/* Score Comparison Dial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Baseline */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Current Actual Risk</span>
                  <div className="text-2xl font-bold font-mono text-slate-800 mt-2">
                    {simResult.current_risk.risk_score} / 100
                  </div>
                  <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    simResult.current_risk.risk_category === 'High'
                      ? 'bg-rose-100 text-rose-700'
                      : simResult.current_risk.risk_category === 'Moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {simResult.current_risk.risk_category} Risk
                  </span>
                </div>

                {/* Score Delta */}
                <div className={`p-4 rounded-xl border text-center flex flex-col justify-center ${
                  simResult.score_difference < 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : simResult.score_difference > 0
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="text-[11px] font-bold uppercase">Risk Delta</span>
                  <div className="text-2xl font-bold font-mono mt-1">
                    {simResult.score_difference < 0 ? (
                      <span className="flex items-center justify-center gap-1">
                        <TrendingDown className="w-5 h-5 text-emerald-600" />
                        {simResult.score_difference} pts
                      </span>
                    ) : simResult.score_difference > 0 ? (
                      <span className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-5 h-5 text-rose-600" />
                        +{simResult.score_difference} pts
                      </span>
                    ) : (
                      '0 pts'
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5">
                    {simResult.score_difference < 0 ? 'Risk Reduced' : simResult.score_difference > 0 ? 'Risk Increased' : 'No Net Shift'}
                  </p>
                </div>

                {/* Simulated Outcome */}
                <div className="p-4 bg-white border border-[#7965E8] rounded-xl shadow-2xs text-center ring-1 ring-[#7965E8]/40">
                  <span className="text-[11px] font-bold text-[#7965E8] uppercase">Simulated Risk</span>
                  <div className="text-2xl font-bold font-mono text-[#7965E8] mt-2">
                    {simResult.simulated_risk.risk_score} / 100
                  </div>
                  <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                    simResult.simulated_risk.risk_category === 'High'
                      ? 'bg-rose-100 text-rose-700'
                      : simResult.simulated_risk.risk_category === 'Moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {simResult.simulated_risk.risk_category} Risk
                  </span>
                </div>
              </div>

              {/* Impact Narrative */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900">Simulation Impact Diagnosis:</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {simResult.impact_summary}
                </p>
              </div>

              {/* Factor by Factor Shift Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900">Factor Change Log</h3>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Factor Name</th>
                      <th className="py-2.5 px-3 text-right">Actual Baseline</th>
                      <th className="py-2.5 px-3 text-right">Hypothetical</th>
                      <th className="py-2.5 px-3 text-right">Delta Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simResult.changed_factors.map((f) => (
                      <tr key={f.factor} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{f.factor}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                          {typeof f.current === 'number' ? f.current.toFixed(1) : f.current} {f.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {typeof f.simulated === 'number' ? f.simulated.toFixed(1) : f.simulated} {f.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          <span className={f.difference > 0 ? 'text-emerald-600 font-bold' : f.difference < 0 ? 'text-rose-600' : 'text-slate-400'}>
                            {f.difference > 0 ? `+${f.difference}` : f.difference} {f.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Suggested Actionable Next Steps */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Strategic Pathways to Achieve This Risk Level:</span>
                </div>
                <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                  {simResult.suggested_next_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
