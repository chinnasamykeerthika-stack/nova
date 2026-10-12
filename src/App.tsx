import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { TopNav } from './components/TopNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StudentDirectoryView } from './components/StudentDirectoryView.tsx';
import { StudentProfileView } from './components/StudentProfileView.tsx';
import { RiskEngineView } from './components/RiskEngineView.tsx';
import { InterventionsView } from './components/InterventionsView.tsx';
import { SimulatorView } from './components/SimulatorView.tsx';
import {
  AddStudentModal,
  EditStudentModal,
  DeleteConfirmModal,
  CreateInterventionModal,
} from './components/Modals.tsx';
import { Student, DashboardData, Intervention, Faculty } from './types.ts';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Cohort & Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);

  // Student directory state
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedRisk, setSelectedRisk] = useState<string>('All');

  // Interventions & Faculty
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [interventionStudentTarget, setInterventionStudentTarget] = useState<{ id: string; name: string } | null>(null);

  // Reseed state
  const [isReseeding, setIsReseeding] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Dashboard
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        q: searchQuery,
        dept: selectedDept,
        year: selectedYear.toString(),
        risk: selectedRisk,
      });
      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalStudents(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [currentPage, searchQuery, selectedDept, selectedYear, selectedRisk]);

  // Fetch Interventions
  const fetchInterventions = useCallback(async () => {
    try {
      const res = await fetch('/api/interventions');
      if (res.ok) {
        const data = await res.json();
        setInterventions(data);
      }
    } catch (err) {
      console.error('Error fetching interventions:', err);
    }
  }, []);

  // Fetch Faculty
  const fetchFaculty = useCallback(async () => {
    try {
      const res = await fetch('/api/faculty');
      if (res.ok) {
        const data = await res.json();
        setFaculty(data);
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchStudents();
    fetchInterventions();
    fetchFaculty();
  }, [fetchDashboard, fetchStudents, fetchInterventions, fetchFaculty]);

  // Reseed Data
  const handleReseedData = async () => {
    setIsReseeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        showToast('Database reset and reseeded with demo data!', 'success');
        await Promise.all([fetchDashboard(), fetchStudents(), fetchInterventions()]);
      } else {
        showToast('Failed to reset database', 'error');
      }
    } catch (err) {
      showToast('Error resetting database', 'error');
    } finally {
      setIsReseeding(false);
    }
  };

  // Student CRUD actions
  const handleCreateStudent = async (data: any) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create student');
    }
    showToast(`Student ${data.student_id} registered successfully!`, 'success');
    await Promise.all([fetchDashboard(), fetchStudents()]);
  };

  const handleUpdateStudent = async (studentId: string, data: any) => {
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update student');
    }
    showToast(`Student ${studentId} updated successfully!`, 'success');
    await Promise.all([fetchDashboard(), fetchStudents()]);
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    const res = await fetch(`/api/students/${deleteStudent.student_id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete student');
    }
    showToast(`Student ${deleteStudent.student_id} deleted`, 'success');
    if (selectedStudentId === deleteStudent.student_id) {
      setSelectedStudentId(null);
      setActiveTab('students');
    }
    await Promise.all([fetchDashboard(), fetchStudents(), fetchInterventions()]);
  };

  // Intervention Actions
  const handleCreateIntervention = async (data: any) => {
    const res = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create intervention');
    }
    showToast('Faculty intervention logged and assigned', 'success');
    await Promise.all([fetchDashboard(), fetchInterventions()]);
  };

  const handleUpdateInterventionStatus = async (
    id: number,
    status: 'Pending' | 'In Progress' | 'Completed',
    outcome?: string
  ) => {
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, outcome }),
      });
      if (res.ok) {
        showToast(`Intervention status updated to ${status}`, 'success');
        await Promise.all([fetchDashboard(), fetchInterventions()]);
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (e) {
      showToast('Error updating status', 'error');
    }
  };

  const handleAddInterventionNote = async (id: number, note: string) => {
    try {
      const res = await fetch(`/api/interventions/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, author: 'Dr. Aris Thorne (Dean)' }),
      });
      if (res.ok) {
        showToast('Follow-up note appended to task', 'success');
        await fetchInterventions();
      } else {
        showToast('Failed to append note', 'error');
      }
    } catch (e) {
      showToast('Error appending note', 'error');
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('profile');
  };

  const handleOpenSimulate = (student: Student) => {
    setSelectedStudentId(student.student_id);
    setActiveTab('simulator');
  };

  const handleOpenCreateInterventionModal = (studentId: string, studentName: string) => {
    setInterventionStudentTarget({ id: studentId, name: studentName });
    setIsInterventionModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] overflow-hidden text-[#202747]">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStudentId={selectedStudentId}
        onReseedData={handleReseedData}
        isReseeding={isReseeding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          onSearchSelect={handleSelectStudent}
          onOpenAddStudent={() => setIsAddModalOpen(true)}
          criticalAlerts={dashboardData?.critical_alerts || []}
          pendingInterventionsCount={dashboardData?.summary.pending_interventions || 0}
        />

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                data={dashboardData}
                loading={loadingDashboard}
                onSelectStudent={handleSelectStudent}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenAddStudent={() => setIsAddModalOpen(true)}
              />
            )}

            {activeTab === 'students' && (
              <StudentDirectoryView
                students={students}
                totalStudents={totalStudents}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedRisk={selectedRisk}
                setSelectedRisk={setSelectedRisk}
                onSelectStudent={handleSelectStudent}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onOpenEditModal={(s) => setEditStudent(s)}
                onOpenDeleteModal={(s) => setDeleteStudent(s)}
                onOpenSimulate={handleOpenSimulate}
              />
            )}

            {activeTab === 'profile' && selectedStudentId && (
              <StudentProfileView
                studentId={selectedStudentId}
                onBack={() => setActiveTab('students')}
                onOpenCreateIntervention={handleOpenCreateInterventionModal}
                onOpenSimulate={handleOpenSimulate}
                showToast={showToast}
              />
            )}

            {activeTab === 'risk_engine' && (
              <RiskEngineView
                showToast={showToast}
                onRefreshCohort={() => {
                  fetchDashboard();
                  fetchStudents();
                }}
              />
            )}

            {activeTab === 'interventions' && (
              <InterventionsView
                interventions={interventions}
                onOpenCreateModal={() => {
                  setInterventionStudentTarget(null);
                  setIsInterventionModalOpen(true);
                }}
                onSelectStudent={handleSelectStudent}
                onUpdateStatus={handleUpdateInterventionStatus}
                onAddNote={handleAddInterventionNote}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView
                students={students}
                initialStudentId={selectedStudentId || undefined}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateStudent}
      />

      <EditStudentModal
        isOpen={!!editStudent}
        student={editStudent}
        onClose={() => setEditStudent(null)}
        onSubmit={handleUpdateStudent}
      />

      <DeleteConfirmModal
        isOpen={!!deleteStudent}
        student={deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteStudent}
      />

      <CreateInterventionModal
        isOpen={isInterventionModalOpen}
        initialStudentId={interventionStudentTarget?.id}
        initialStudentName={interventionStudentTarget?.name}
        students={students}
        faculty={faculty}
        onClose={() => setIsInterventionModalOpen(false)}
        onSubmit={handleCreateIntervention}
      />

      {/* Floating Toast Alerts */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white animate-fade-in ${
              toast.type === 'success' ? 'bg-[#7965E8]' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-2 hover:opacity-80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
