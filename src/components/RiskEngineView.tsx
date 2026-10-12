import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Info,
  RotateCcw,
  Save,
  HelpCircle,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { ThresholdSettings } from '../types.ts';
import { DEFAULT_THRESHOLDS } from '../server/analytics.ts';

interface RiskEngineViewProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onRefreshCohort: () => void;
}

export const RiskEngineView: React.FC<RiskEngineViewProps> = ({
  showToast,
  onRefreshCohort,
}) => {
  const [settings, setSettings] = useState<ThresholdSettings>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/thresholds')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('Risk formula thresholds updated in database!', 'success');
        onRefreshCohort();
      } else {
        showToast('Failed to save threshold settings', 'error');
      }
    } catch (e) {
      showToast('Network error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_THRESHOLDS);
  };

  const totalWeights = (
    settings.attendance_weight +
    settings.marks_weight +
    settings.cgpa_weight +
    settings.assignment_weight +
    settings.trend_weight
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202747] tracking-tight">Explainable AI Risk Engine & Threshold Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, deterministic rule-based screening engine with configurable collegiate thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#7965E8] hover:bg-[#6752D8] rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-start gap-3">
        <Info className="w-5 h-5 text-[#7965E8] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-900">Deterministic Mathematical Formulation:</p>
          <p>
            NOVA calculates an explainable Support Screening Score between <strong>0 and 100</strong>. Each student is evaluated across 5 distinct academic indicators. Each factor is mapped to a standardized sub-score (0-100) and weighted according to faculty parameters.
          </p>
          <p className="text-[11px] text-slate-500 italic">
            * Screening estimate for faculty advising, not a guaranteed prediction of student failure. Missing metrics are mapped to neutral baseline (30) rather than penalized as a false failure.
          </p>
        </div>
      </div>

      {/* Grid: Cutoff Thresholds & Factor Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Risk Classification Boundaries */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#7965E8]" />
              <h2 className="text-sm font-bold text-slate-900">Risk Tier Classification Cutoffs</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Scale: 0 to 100</span>
          </div>

          {/* Slider 1: Low-to-Moderate Boundary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800">Low Risk Cutoff:</span>
                <span className="text-slate-500 ml-1.5">(Scores below this are Low Risk)</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                0 – {settings.low_threshold - 1} pts
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="55"
              step="1"
              value={settings.low_threshold}
              onChange={(e) =>
                setSettings({ ...settings, low_threshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[11px] text-slate-400">Current cutoff: <strong>{settings.low_threshold}</strong></p>
          </div>

          {/* Slider 2: Moderate-to-High Boundary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800">High Risk Trigger:</span>
                <span className="text-slate-500 ml-1.5">(Scores at or above this trigger High Risk)</span>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {settings.high_threshold} – 100 pts
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="85"
              step="1"
              value={settings.high_threshold}
              onChange={(e) =>
                setSettings({ ...settings, high_threshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-rose-500"
            />
            <p className="text-[11px] text-slate-400">Current cutoff: <strong>{settings.high_threshold}</strong></p>
          </div>

          {/* Tier Visual Breakdown */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-emerald-100/60 border border-emerald-200/60">
              <p className="font-bold text-emerald-900">Low Risk</p>
              <p className="text-[11px] text-emerald-700 font-mono mt-0.5">0 – {settings.low_threshold - 1}</p>
            </div>
            <div className="p-2 rounded bg-amber-100/60 border border-amber-200/60">
              <p className="font-bold text-amber-900">Moderate Risk</p>
              <p className="text-[11px] text-amber-700 font-mono mt-0.5">{settings.low_threshold} – {settings.high_threshold - 1}</p>
            </div>
            <div className="p-2 rounded bg-rose-100/60 border border-rose-200/60">
              <p className="font-bold text-rose-900">High Risk</p>
              <p className="text-[11px] text-rose-700 font-mono mt-0.5">{settings.high_threshold} – 100</p>
            </div>
          </div>
        </div>

        {/* Card 2: Factor Weight Sliders */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#7965E8]" />
              <h2 className="text-sm font-bold text-slate-900">Factor Relative Weighting</h2>
            </div>
            <span className={`text-[11px] font-mono font-bold ${Math.abs(totalWeights - 1.0) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
              Sum: {(totalWeights * 100).toFixed(0)}%
            </span>
          </div>

          {/* Weight 1: Attendance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Class Attendance</span>
              <span className="font-mono text-slate-600 font-bold">{(settings.attendance_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={settings.attendance_weight}
              onChange={(e) => setSettings({ ...settings, attendance_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[10px] text-slate-400">75% attendance university regulatory cutoff criteria</p>
          </div>

          {/* Weight 2: Assessment Marks */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Continuous Assessment Marks</span>
              <span className="font-mono text-slate-600 font-bold">{(settings.marks_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={settings.marks_weight}
              onChange={(e) => setSettings({ ...settings, marks_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[10px] text-slate-400">Midterm exams and internal continuous tests</p>
          </div>

          {/* Weight 3: CGPA */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Cumulative CGPA</span>
              <span className="font-mono text-slate-600 font-bold">{(settings.cgpa_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={settings.cgpa_weight}
              onChange={(e) => setSettings({ ...settings, cgpa_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[10px] text-slate-400">Longitudinal academic standing across all semesters</p>
          </div>

          {/* Weight 4: Assignments */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Assignment Submissions</span>
              <span className="font-mono text-slate-600 font-bold">{(settings.assignment_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.05"
              value={settings.assignment_weight}
              onChange={(e) => setSettings({ ...settings, assignment_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[10px] text-slate-400">Timely lab manual submissions and coursework homework</p>
          </div>

          {/* Weight 5: Momentum / Backlogs */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Backlogs & Semester Momentum</span>
              <span className="font-mono text-slate-600 font-bold">{(settings.trend_weight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.20"
              step="0.05"
              value={settings.trend_weight}
              onChange={(e) => setSettings({ ...settings, trend_weight: parseFloat(e.target.value) })}
              className="w-full accent-[#7965E8]"
            />
            <p className="text-[10px] text-slate-400">Penalizes active backlogs and negative GPA trajectory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
