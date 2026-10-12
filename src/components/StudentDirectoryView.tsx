import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types.ts';

interface StudentDirectoryViewProps {
  students: Student[];
  totalStudents: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedRisk: string;
  setSelectedRisk: (r: string) => void;
  onSelectStudent: (studentId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onOpenDeleteModal: (student: Student) => void;
  onOpenSimulate: (student: Student) => void;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  students,
  totalStudents,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  selectedYear,
  setSelectedYear,
  selectedRisk,
  setSelectedRisk,
  onSelectStudent,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenSimulate,
}) => {
  const departments = ['All', 'Computer Science', 'Data Science', 'Electronics & Communication', 'Information Technology', 'Mechanical Engineering'];
  const years = [0, 1, 2, 3, 4];
  const riskCategories = ['All', 'Low', 'Moderate', 'High'];

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202747] tracking-tight">Student Directory & Academic Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full cohort management with live explainable risk assessments and direct faculty workflows.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#7965E8]"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#7965E8]"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#7965E8]"
            >
              <option value={0}>All Academic Years</option>
              <option value={1}>Year 1 (Freshman)</option>
              <option value={2}>Year 2 (Sophomore)</option>
              <option value={3}>Year 3 (Junior)</option>
              <option value={4}>Year 4 (Senior)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#7965E8]"
            >
              <option value="All">All Risk Tiers</option>
              <option value="High">High Risk (Score ≥ 70)</option>
              <option value="Moderate">Moderate Risk (40 - 69)</option>
              <option value="Low">Low Risk (&lt; 40)</option>
            </select>
          </div>
        </div>

        {/* Filter status summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong className="text-slate-700">{students.length}</strong> of <strong className="text-slate-700">{totalStudents}</strong> matching student records</span>
          {(searchQuery || selectedDept !== 'All' || selectedYear !== 0 || selectedRisk !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('All');
                setSelectedYear(0);
                setSelectedRisk('All');
              }}
              className="text-[#7965E8] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* High-Density Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Full Name & Email</th>
                <th className="py-3 px-4">Department & Year</th>
                <th className="py-3 px-3 text-right">CGPA</th>
                <th className="py-3 px-3 text-right">Attendance</th>
                <th className="py-3 px-3 text-right">Avg Marks</th>
                <th className="py-3 px-4 text-center">AI Risk Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const riskBadge =
                    student.risk_category === 'High' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-100">
                        High ({student.risk_score})
                      </span>
                    ) : student.risk_category === 'Moderate' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-amber-700 bg-amber-100">
                        Moderate ({student.risk_score})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-100">
                        Low ({student.risk_score})
                      </span>
                    );

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectStudent(student.student_id)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {student.student_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-[#7965E8] transition-colors">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{student.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{student.department}</div>
                        <div className="text-[11px] text-slate-400">Year {student.academic_year} · Sem {student.semester}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                        {student.cgpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`font-mono font-semibold ${
                            student.attendance_pct < 75 ? 'text-rose-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {student.attendance_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                        {student.avg_marks.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {riskBadge}
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectStudent(student.student_id)}
                            className="p-1.5 text-slate-500 hover:text-[#7965E8] hover:bg-[#E9E3FF] rounded transition-colors"
                            title="Open Detailed Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenSimulate(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Simulate What-If Scenarios"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(student)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Student Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenDeleteModal(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages || 1}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
