import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  RotateCcw,
  GraduationCap,
  ChevronRight,
  Database,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'students' | 'profile' | 'risk_engine' | 'interventions' | 'simulator';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedStudentId: string | null;
  onReseedData: () => void;
  isReseeding: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedStudentId,
  onReseedData,
  isReseeding,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'students' as ActiveTab, label: 'Student Directory', icon: Users },
    { id: 'risk_engine' as ActiveTab, label: 'Explainable AI Risk', icon: ShieldAlert },
    { id: 'interventions' as ActiveTab, label: 'Faculty Interventions', icon: ClipboardList },
    { id: 'simulator' as ActiveTab, label: 'What-If Simulator', icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E9E3FF] flex items-center justify-center text-[#7965E8] shadow-xs">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#202747]">NOVA</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-[#DDEBFF] text-[#285DB8]">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Student Success Platform</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#E9E3FF] text-[#7965E8] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7965E8]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#7965E8]" />}
                </button>
              );
            })}

            {/* Contextual Student Profile Link */}
            {selectedStudentId && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-[#E9E3FF] text-[#7965E8] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-[#7965E8]' : 'text-slate-400'}`} />
                  <span className="truncate">Profile: {selectedStudentId}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Database & Quick Seed Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-slate-700">SQLite Database</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">nova.db</span>
        </div>

        <button
          onClick={onReseedData}
          disabled={isReseeding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs"
          title="Reseed demo database with default fictional students"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
          <span>{isReseeding ? 'Resetting...' : 'Reseed Demo Data'}</span>
        </button>

        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#DDEBFF] text-[#285DB8] flex items-center justify-center font-bold text-xs shrink-0">
            AT
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">Dr. Aris Thorne</p>
            <p className="text-[11px] text-slate-500 truncate">Dean of Academic Affairs</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
