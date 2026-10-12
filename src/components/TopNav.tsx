import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, ShieldAlert, Clock, Plus, ExternalLink } from 'lucide-react';
import { DashboardData } from '../types.ts';

interface TopNavProps {
  onSearchSelect: (studentId: string) => void;
  onOpenAddStudent: () => void;
  criticalAlerts: DashboardData['critical_alerts'];
  pendingInterventionsCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearchSelect,
  onOpenAddStudent,
  criticalAlerts,
  pendingInterventionsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; dept: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Live search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            data.students.map((s: any) => ({
              id: s.student_id,
              name: s.name,
              dept: s.department,
            }))
          );
        }
      } catch (e) {
        // quiet error
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalNotifs = criticalAlerts.length + (pendingInterventionsCount > 0 ? 1 : 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 relative z-30">
      {/* Zone 1: Academic Term & Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[#202747]">Fall Semester 2026</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs px-2 py-0.5 rounded-md bg-[#DDF5E8] text-[#1E7E55] font-medium">
          Midterm Phase
        </span>
      </div>

      {/* Zone 2: Search Bar */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student by name or ID (e.g., Aiden, STU-2024-001)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#7965E8] focus:ring-2 focus:ring-[#E9E3FF] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 z-50">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Matching Students
            </div>
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSearchSelect(item.id);
                  setShowResults(false);
                  setSearchQuery('');
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{item.id} · {item.dept}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenAddStudent}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Student</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 relative transition-colors"
            title="System notifications and high risk alerts"
          >
            <Bell className="w-4 h-4" />
            {totalNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalNotifs}
              </span>
            )}
          </button>

          {/* Notifications Drawer */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Academic Alerts & Tasks</span>
                <span className="text-[10px] text-slate-400 font-mono">{totalNotifs} items</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {criticalAlerts.length === 0 && pendingInterventionsCount === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active critical alerts or pending interventions.
                  </div>
                )}

                {criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      onSearchSelect(alert.student_id);
                      setShowNotifications(false);
                    }}
                    className="p-3 hover:bg-rose-50/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 truncate">{alert.student_name}</p>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                            Risk {alert.risk_score}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{alert.issue}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{alert.student_id} · {alert.department}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingInterventionsCount > 0 && (
                  <div className="p-3 bg-amber-50/40">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{pendingInterventionsCount} faculty interventions pending review</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
