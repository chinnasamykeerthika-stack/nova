import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Intervention } from '../types.ts';

interface InterventionsViewProps {
  interventions: Intervention[];
  onOpenCreateModal: () => void;
  onSelectStudent: (studentId: string) => void;
  onUpdateStatus: (id: number, status: 'Pending' | 'In Progress' | 'Completed', outcome?: string) => void;
  onAddNote: (id: number, note: string) => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = ({
  interventions,
  onOpenCreateModal,
  onSelectStudent,
  onUpdateStatus,
  onAddNote,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [outcomeInputs, setOutcomeInputs] = useState<Record<number, string>>({});
  const [editingOutcomeId, setEditingOutcomeId] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = interventions.filter((item) => {
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    if (filterPriority !== 'All' && item.priority !== filterPriority) return false;
    return true;
  });

  const overdueCount = interventions.filter(
    (i) => i.status !== 'Completed' && i.due_date < todayStr
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202747] tracking-tight">Faculty Intervention Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active mentorship tasks, progress checkpoints, and student advisory outcomes.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Faculty Intervention</span>
        </button>
      </div>

      {/* KPI & Status Filter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'All'
              ? 'bg-white border-[#7965E8] shadow-xs ring-1 ring-[#7965E8]'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500">Total Interventions</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{interventions.length}</div>
        </button>

        <button
          onClick={() => setFilterStatus('Pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'Pending'
              ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-1 ring-amber-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-semibold text-amber-800">Pending Review</span>
          <div className="text-xl font-bold text-amber-900 mt-1 tabular-nums">
            {interventions.filter((i) => i.status === 'Pending').length}
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('In Progress')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'In Progress'
              ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-semibold text-blue-800">In Progress</span>
          <div className="text-xl font-bold text-blue-900 mt-1 tabular-nums">
            {interventions.filter((i) => i.status === 'In Progress').length}
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('Completed')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'Completed'
              ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-1 ring-emerald-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-800">Completed & Verified</span>
          <div className="text-xl font-bold text-emerald-900 mt-1 tabular-nums">
            {interventions.filter((i) => i.status === 'Completed').length}
          </div>
        </button>
      </div>

      {/* Overdue alert if any */}
      {overdueCount > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>{overdueCount} task(s)</strong> are overdue past their review deadlines. Please update status or follow up with faculty.</span>
          </div>
        </div>
      )}

      {/* Priority Filter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Filter by Priority:</span>
          {['All', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterPriority === p
                  ? 'bg-[#E9E3FF] text-[#7965E8] font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-slate-400">Showing {filtered.length} interventions</span>
      </div>

      {/* Interventions Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            No interventions match the selected filter criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const isOverdue = item.status !== 'Completed' && item.due_date < todayStr;

            return (
              <div
                key={item.id}
                className={`p-5 bg-white border rounded-xl shadow-2xs space-y-3.5 transition-all ${
                  isOverdue ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectStudent(item.student_id)}
                          className="text-sm font-bold text-slate-900 hover:text-[#7965E8] transition-colors"
                        >
                          {item.student_name || item.student_id}
                        </button>
                        <span className="text-xs font-mono text-slate-400">{item.student_id}</span>
                        {item.department && (
                          <span className="text-xs text-slate-500">· {item.department}</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{item.issue}</p>
                    </div>
                  </div>

                  {/* Priority & Status Select */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        item.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : item.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.priority} Priority
                    </span>

                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        onUpdateStatus(
                          item.id,
                          e.target.value as 'Pending' | 'In Progress' | 'Completed',
                          item.outcome
                        )
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : item.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Plan Details & Mentor Attribution */}
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-1">
                  <p><strong>Planned Action:</strong> {item.planned_action}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Assigned Mentor: <strong>{item.mentor_name}</strong></span>
                    <span>·</span>
                    <span>Due Date: <strong className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>{item.due_date}</strong> {isOverdue && '(OVERDUE)'}</span>
                    <span>·</span>
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Performance Context if available */}
                {(item.cgpa_before !== undefined || item.attendance_before !== undefined) && (
                  <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md">
                    <span>Performance baseline at time of intervention:</span>
                    {item.cgpa_before !== undefined && (
                      <span className="font-mono font-bold text-slate-700">CGPA: {item.cgpa_before.toFixed(2)}</span>
                    )}
                    {item.attendance_before !== undefined && (
                      <span className="font-mono font-bold text-slate-700">Attendance: {item.attendance_before.toFixed(1)}%</span>
                    )}
                  </div>
                )}

                {/* Outcome Display or Edit */}
                {item.outcome ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    <span className="font-bold">Follow-Up Outcome:</span> {item.outcome}
                  </div>
                ) : editingOutcomeId === item.id ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <label className="text-xs font-semibold text-slate-800">Record Intervention Outcome:</label>
                    <textarea
                      rows={2}
                      placeholder="Enter observed resolution or academic improvements..."
                      value={outcomeInputs[item.id] || ''}
                      onChange={(e) =>
                        setOutcomeInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#7965E8]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingOutcomeId(null)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onUpdateStatus(item.id, 'Completed', outcomeInputs[item.id] || 'Intervention goal met.');
                          setEditingOutcomeId(null);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                      >
                        Save & Mark Completed
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingOutcomeId(item.id)}
                    className="text-xs text-[#7965E8] hover:underline font-semibold"
                  >
                    + Record final outcome & resolution
                  </button>
                )}

                {/* Timestamped Follow-up Notes Timeline */}
                {item.notes && item.notes.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Follow-up Notes:</span>
                    {item.notes.map((n) => (
                      <div key={n.id} className="p-2 bg-slate-50 rounded text-xs text-slate-700">
                        <p>{n.note}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          — {n.author} · {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Quick Add Note */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add follow-up progress note..."
                    value={noteInputs[item.id] || ''}
                    onChange={(e) =>
                      setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#7965E8]"
                  />
                  <button
                    onClick={() => {
                      if ((noteInputs[item.id] || '').trim()) {
                        onAddNote(item.id, noteInputs[item.id]!.trim());
                        setNoteInputs((prev) => ({ ...prev, [item.id]: '' }));
                      }
                    }}
                    disabled={!(noteInputs[item.id] || '').trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-[#7965E8] bg-[#E9E3FF] hover:bg-[#ded6ff] rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
