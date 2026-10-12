import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Users,
  Award,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react';
import { DashboardData } from '../types.ts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  onSelectStudent: (studentId: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onSelectStudent,
  onNavigateTab,
  onOpenAddStudent,
}) => {
  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#7965E8] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Computing cohort intelligence from SQLite records...</p>
        </div>
      </div>
    );
  }

  const { summary, charts, critical_alerts, recent_activities } = data;

  // Chart 1: CGPA Performance Distribution
  const performanceChartData = {
    labels: charts.performance_distribution.map((d) => d.label),
    datasets: [
      {
        label: 'Students Count',
        data: charts.performance_distribution.map((d) => d.count),
        backgroundColor: '#7965E8',
        borderRadius: 6,
      },
    ],
  };

  // Chart 2: Attendance vs Marks Scatter Plot
  const scatterData = {
    datasets: [
      {
        label: 'High Risk',
        data: charts.attendance_vs_marks
          .filter((d) => d.risk === 'High')
          .map((d) => ({ x: d.attendance, y: d.marks, student_id: d.student_id, name: d.name })),
        backgroundColor: 'rgba(239, 68, 68, 0.85)', // Red
        pointRadius: 6,
      },
      {
        label: 'Moderate Risk',
        data: charts.attendance_vs_marks
          .filter((d) => d.risk === 'Moderate')
          .map((d) => ({ x: d.attendance, y: d.marks, student_id: d.student_id, name: d.name })),
        backgroundColor: 'rgba(245, 158, 11, 0.85)', // Amber
        pointRadius: 6,
      },
      {
        label: 'Low Risk',
        data: charts.attendance_vs_marks
          .filter((d) => d.risk === 'Low')
          .map((d) => ({ x: d.attendance, y: d.marks, student_id: d.student_id, name: d.name })),
        backgroundColor: 'rgba(16, 185, 129, 0.85)', // Emerald
        pointRadius: 6,
      },
    ],
  };

  // Chart 3: Department Performance
  const deptChartData = {
    labels: charts.department_performance.map((d) => d.department.length > 15 ? d.department.slice(0, 14) + '...' : d.department),
    datasets: [
      {
        label: 'Avg CGPA (x10)',
        data: charts.department_performance.map((d) => d.avg_cgpa * 10),
        backgroundColor: '#9A8AF2',
        borderRadius: 4,
      },
      {
        label: 'Avg Attendance %',
        data: charts.department_performance.map((d) => d.avg_attendance),
        backgroundColor: '#60A5FA',
        borderRadius: 4,
      },
    ],
  };

  // Chart 4: Monthly Trends
  const trendChartData = {
    labels: charts.monthly_trends.map((t) => t.month),
    datasets: [
      {
        label: 'Assessment Marks %',
        data: charts.monthly_trends.map((t) => t.avg_marks),
        borderColor: '#7965E8',
        backgroundColor: 'rgba(121, 101, 232, 0.12)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Attendance %',
        data: charts.monthly_trends.map((t) => t.avg_attendance),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  // Chart 5: Risk Doughnut
  const riskDoughnutData = {
    labels: charts.risk_distribution.map((r) => r.category),
    datasets: [
      {
        data: charts.risk_distribution.map((r) => r.count),
        backgroundColor: ['#34D399', '#FBBF24', '#F87171'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Mission Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202747] tracking-tight">Executive Cohort Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time academic telemetry, screening risk index, and faculty action pipelines.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7965E8]" />
            <span>Academic Simulator</span>
          </button>
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Students */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled</span>
            <div className="w-7 h-7 rounded-lg bg-[#E9E3FF] flex items-center justify-center text-[#7965E8]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total_students}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">All 5 Engineering depts</p>
          </div>
        </div>

        {/* Card 2: Average CGPA */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cohort CGPA</span>
            <div className="w-7 h-7 rounded-lg bg-[#DDEBFF] flex items-center justify-center text-[#2563EB]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{summary.avg_cgpa.toFixed(2)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Out of 10.0 scale</p>
          </div>
        </div>

        {/* Card 3: Average Attendance */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Attendance</span>
            <div className="w-7 h-7 rounded-lg bg-[#DDF5E8] flex items-center justify-center text-[#15803D]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{summary.avg_attendance.toFixed(1)}%</div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Above 75% cutoff</p>
          </div>
        </div>

        {/* Card 4: Needing Support */}
        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Support Needed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-900 tabular-nums">{summary.needing_support}</div>
            <p className="text-[11px] text-rose-700 mt-0.5 font-medium">High Risk score ≥ 70</p>
          </div>
        </div>

        {/* Card 5: Performing Well */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">High Performers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-900 tabular-nums">{summary.performing_well}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Low Risk & CGPA ≥ 8.0</p>
          </div>
        </div>

        {/* Card 6: Pending Interventions */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Active Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-900 tabular-nums">{summary.pending_interventions}</div>
            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Pending or In Progress</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance vs Marks Scatter */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance vs. Assessment Marks</h2>
              <p className="text-xs text-slate-500">Cross-quadrant correlation identifying disengaged vs struggling students</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Interactive Scatter</span>
          </div>
          <div className="h-64">
            <Scatter
              data={scatterData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: { display: true, text: 'Class Attendance (%)', font: { size: 11 } },
                    min: 40,
                    max: 100,
                  },
                  y: {
                    title: { display: true, text: 'Average Marks (%)', font: { size: 11 } },
                    min: 30,
                    max: 100,
                  },
                },
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } },
                  tooltip: {
                    callbacks: {
                      label: (ctx: any) => {
                        const raw = ctx.raw;
                        return `${raw.name} (${raw.student_id}): Attendance ${raw.x}%, Marks ${raw.y}%`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Risk Distribution Doughnut */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Risk Categorization</h2>
                <p className="text-xs text-slate-500">Cohort split by academic support score</p>
              </div>
            </div>
            <div className="h-52 relative flex items-center justify-center">
              <Doughnut
                data={riskDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 text-center gap-1 text-xs">
            {charts.risk_distribution.map((r) => (
              <div key={r.category}>
                <p className="text-[11px] text-slate-500 font-medium truncate">{r.category}</p>
                <p className="font-bold text-slate-900 tabular-nums">{r.count} ({r.percentage}%)</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Distribution Bar Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">CGPA Distribution</h2>
              <p className="text-xs text-slate-500">Student count by CGPA bands</p>
            </div>
          </div>
          <div className="h-56">
            <Bar
              data={performanceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
        </div>

        {/* Department Performance */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Benchmarks</h2>
              <p className="text-xs text-slate-500">CGPA (scaled x10) vs Attendance %</p>
            </div>
          </div>
          <div className="h-56">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } },
                },
                scales: {
                  y: { min: 40, max: 100 },
                },
              }}
            />
          </div>
        </div>

        {/* Monthly Performance Trends */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Semester Trends</h2>
              <p className="text-xs text-slate-500">Cohort marks and attendance trajectory</p>
            </div>
          </div>
          <div className="h-56">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } },
                },
                scales: {
                  y: { min: 50, max: 100 },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Critical Alerts & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">Critical Support Alerts</h2>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs text-[#7965E8] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {critical_alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No students currently in the critical support tier.
              </div>
            ) : (
              critical_alerts.map((alert) => (
                <div key={alert.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{alert.student_name}</p>
                      <span className="text-[10px] font-mono text-slate-400">{alert.student_id}</span>
                      <span className="text-[10px] font-medium text-slate-500">· {alert.department}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{alert.issue}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-100 tabular-nums">
                      Score {alert.risk_score}
                    </span>
                    <button
                      onClick={() => onSelectStudent(alert.student_id)}
                      className="px-2.5 py-1 text-xs font-medium text-[#7965E8] bg-[#E9E3FF] hover:bg-[#ded6ff] rounded-md transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7965E8]" />
              <h2 className="text-sm font-bold text-slate-900">Faculty Intervention Activity</h2>
            </div>
            <button
              onClick={() => onNavigateTab('interventions')}
              className="text-xs text-[#7965E8] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recent_activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent intervention activities recorded yet.
              </div>
            ) : (
              recent_activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 leading-snug">{act.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>By {act.actor}</span>
                      <span>·</span>
                      <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
