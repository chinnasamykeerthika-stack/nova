import { FactorContribution, RiskAnalysis, ThresholdSettings } from '../types.ts';

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  low_threshold: 40,
  high_threshold: 70,
  attendance_weight: 0.30,
  marks_weight: 0.25,
  cgpa_weight: 0.25,
  assignment_weight: 0.15,
  trend_weight: 0.05,
};

export interface StudentMetricsInput {
  student_id: string;
  name?: string;
  attendance_pct: number | null | undefined;
  avg_marks: number | null | undefined;
  cgpa: number | null | undefined;
  assignment_completion_pct: number | null | undefined;
  backlogs?: number | null | undefined;
  prev_semester_gpa?: number | null | undefined;
}

export function calculateSubScore(
  factorType: 'attendance' | 'marks' | 'cgpa' | 'assignment' | 'trend',
  value: number | null | undefined,
  auxValue?: number | null | undefined
): { score: number; status: 'Good' | 'Moderate' | 'Critical'; summary: string; isMissing: boolean } {
  if (value === null || value === undefined || isNaN(value)) {
    // Missing data is assigned neutral/baseline score (30) so as not to penalize as an automatic failure
    return {
      score: 30,
      status: 'Moderate',
      summary: 'Data not recorded yet; evaluated with neutral baseline screening.',
      isMissing: true,
    };
  }

  let score = 0;
  let status: 'Good' | 'Moderate' | 'Critical' = 'Good';
  let summary = '';

  switch (factorType) {
    case 'attendance': {
      // Benchmark: >= 85% is ideal (0 risk), 75-84% moderate, < 75% critical, < 65% extreme
      if (value >= 85) {
        score = Math.max(0, (100 - value) * 1.0); // 0 - 15
        status = 'Good';
        summary = `Optimal attendance at ${value.toFixed(1)}%. Meets accreditation criteria.`;
      } else if (value >= 75) {
        score = 15 + ((85 - value) / 10) * 35; // 15 - 50
        status = 'Moderate';
        summary = `Acceptable attendance (${value.toFixed(1)}%), but approaching mandatory 75% cutoff.`;
      } else if (value >= 65) {
        score = 50 + ((75 - value) / 10) * 30; // 50 - 80
        status = 'Critical';
        summary = `Below mandatory 75% threshold (${value.toFixed(1)}%). At risk of exam debarment.`;
      } else {
        score = Math.min(100, 80 + ((65 - value) / 65) * 20); // 80 - 100
        status = 'Critical';
        summary = `Severe absenteeism at ${value.toFixed(1)}%. Immediate dean advisory needed.`;
      }
      break;
    }

    case 'marks': {
      // Benchmark: >= 75% excellent, 60-74% fair, 50-59% low, < 50% failing
      if (value >= 75) {
        score = Math.max(0, (100 - value) * 0.6); // 0 - 15
        status = 'Good';
        summary = `Strong subject comprehension with ${value.toFixed(1)}% average marks.`;
      } else if (value >= 60) {
        score = 15 + ((75 - value) / 15) * 35; // 15 - 50
        status = 'Moderate';
        summary = `Average score of ${value.toFixed(1)}%. Conceptual reinforcement recommended.`;
      } else if (value >= 50) {
        score = 50 + ((60 - value) / 10) * 30; // 50 - 80
        status = 'Critical';
        summary = `Near-passing mark of ${value.toFixed(1)}%. High risk of internal test failure.`;
      } else {
        score = Math.min(100, 80 + ((50 - value) / 50) * 20);
        status = 'Critical';
        summary = `Failing average marks (${value.toFixed(1)}%). Requires structured subject remediation.`;
      }
      break;
    }

    case 'cgpa': {
      // Scale 0.0 to 10.0: >= 8.0 high honor, 7.0-7.9 solid, 6.0-6.9 needs support, < 6.0 academic probation
      if (value >= 8.0) {
        score = Math.max(0, (10 - value) * 7.5); // 0 - 15
        status = 'Good';
        summary = `Distinction tier CGPA of ${value.toFixed(2)}. Consistent academic pacing.`;
      } else if (value >= 7.0) {
        score = 15 + ((8.0 - value) / 1.0) * 30; // 15 - 45
        status = 'Moderate';
        summary = `Satisfactory CGPA of ${value.toFixed(2)}. Minor GPA lift potential.`;
      } else if (value >= 6.0) {
        score = 45 + ((7.0 - value) / 1.0) * 35; // 45 - 80
        status = 'Critical';
        summary = `Marginal CGPA (${value.toFixed(2)}). Vulnerable to semester academic notice.`;
      } else {
        score = Math.min(100, 80 + ((6.0 - Math.max(0, value)) / 6.0) * 20);
        status = 'Critical';
        summary = `Critical CGPA (${value.toFixed(2)}). Falling below minimum graduation benchmarks.`;
      }
      break;
    }

    case 'assignment': {
      // Benchmark: >= 90% full compliance, 75-89% good, 60-74% delayed, < 60% chronic delinquency
      if (value >= 90) {
        score = Math.max(0, (100 - value) * 1.0);
        status = 'Good';
        summary = `High task adherence (${value.toFixed(1)}% assignments submitted on time).`;
      } else if (value >= 75) {
        score = 10 + ((90 - value) / 15) * 35;
        status = 'Moderate';
        summary = `Moderate task submission (${value.toFixed(1)}%). Minor missed deadlines.`;
      } else if (value >= 60) {
        score = 45 + ((75 - value) / 15) * 35;
        status = 'Critical';
        summary = `Low submission rate (${value.toFixed(1)}%). Multiple pending coursework deliverables.`;
      } else {
        score = Math.min(100, 80 + ((60 - value) / 60) * 20);
        status = 'Critical';
        summary = `Severe assignment deficit (${value.toFixed(1)}%). Significant coursework loss.`;
      }
      break;
    }

    case 'trend': {
      // auxValue is prev_semester_gpa or backlogs
      const backlogs = auxValue || 0;
      let trendScore = 0;
      if (backlogs > 0) {
        trendScore += Math.min(60, backlogs * 30);
      }
      // If current cgpa is below prev gpa by > 0.5
      if (value && auxValue && value < auxValue) {
        const delta = auxValue - value;
        trendScore += Math.min(40, delta * 30);
      }
      score = Math.min(100, trendScore);
      if (score < 25) {
        status = 'Good';
        summary = backlogs === 0 ? 'Clear semester standing with zero active backlogs.' : 'Stable trend.';
      } else if (score < 60) {
        status = 'Moderate';
        summary = `${backlogs} active backlog(s) recorded or minor semester-over-semester dip.`;
      } else {
        status = 'Critical';
        summary = `Multiple unresolved backlogs (${backlogs}) or sharp academic decline detected.`;
      }
      break;
    }
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score * 10) / 10)),
    status,
    summary,
    isMissing: false,
  };
}

export function computeRiskScore(
  data: StudentMetricsInput,
  settings: ThresholdSettings = DEFAULT_THRESHOLDS
): RiskAnalysis {
  // 1. Calculate each factor sub-score
  const att = calculateSubScore('attendance', data.attendance_pct);
  const marks = calculateSubScore('marks', data.avg_marks);
  const gpa = calculateSubScore('cgpa', data.cgpa);
  const assign = calculateSubScore('assignment', data.assignment_completion_pct);
  const trend = calculateSubScore('trend', data.cgpa, data.backlogs);

  // Normalize weights in case user modified them
  const sumWeights =
    settings.attendance_weight +
    settings.marks_weight +
    settings.cgpa_weight +
    settings.assignment_weight +
    settings.trend_weight || 1.0;

  const wAtt = settings.attendance_weight / sumWeights;
  const wMarks = settings.marks_weight / sumWeights;
  const wGpa = settings.cgpa_weight / sumWeights;
  const wAssign = settings.assignment_weight / sumWeights;
  const wTrend = settings.trend_weight / sumWeights;

  const factors: FactorContribution[] = [
    {
      name: 'Class Attendance',
      raw_value: data.attendance_pct ?? 0,
      raw_unit: '%',
      sub_score: att.score,
      weight: wAtt,
      weighted_points: Math.round(att.score * wAtt * 10) / 10,
      status: att.status,
      summary: att.summary,
    },
    {
      name: 'Assessment Marks',
      raw_value: data.avg_marks ?? 0,
      raw_unit: '%',
      sub_score: marks.score,
      weight: wMarks,
      weighted_points: Math.round(marks.score * wMarks * 10) / 10,
      status: marks.status,
      summary: marks.summary,
    },
    {
      name: 'Cumulative CGPA',
      raw_value: data.cgpa ?? 0,
      raw_unit: ' / 10',
      sub_score: gpa.score,
      weight: wGpa,
      weighted_points: Math.round(gpa.score * wGpa * 10) / 10,
      status: gpa.status,
      summary: gpa.summary,
    },
    {
      name: 'Assignment Submissions',
      raw_value: data.assignment_completion_pct ?? 0,
      raw_unit: '%',
      sub_score: assign.score,
      weight: wAssign,
      weighted_points: Math.round(assign.score * wAssign * 10) / 10,
      status: assign.status,
      summary: assign.summary,
    },
    {
      name: 'Backlogs & Momentum',
      raw_value: data.backlogs ?? 0,
      raw_unit: ' arrears',
      sub_score: trend.score,
      weight: wTrend,
      weighted_points: Math.round(trend.score * wTrend * 10) / 10,
      status: trend.status,
      summary: trend.summary,
    },
  ];

  const totalWeighted = factors.reduce((acc, f) => acc + f.weighted_points, 0);
  const finalScore = Math.min(100, Math.max(0, Math.round(totalWeighted)));

  // Categorize
  let risk_category: 'Low' | 'Moderate' | 'High' = 'Low';
  if (finalScore >= settings.high_threshold) {
    risk_category = 'High';
  } else if (finalScore >= settings.low_threshold) {
    risk_category = 'Moderate';
  } else {
    risk_category = 'Low';
  }

  // Key concerns and positive factors
  const key_concerns: string[] = [];
  const positive_factors: string[] = [];

  if ((data.attendance_pct ?? 0) < 75) {
    key_concerns.push(`Attendance is at ${data.attendance_pct?.toFixed(1)}%, breaching the 75% college minimum.`);
  } else if ((data.attendance_pct ?? 0) >= 85) {
    positive_factors.push(`Strong lecture attendance of ${data.attendance_pct?.toFixed(1)}%.`);
  }

  if ((data.avg_marks ?? 0) < 60) {
    key_concerns.push(`Continuous internal evaluation average is ${data.avg_marks?.toFixed(1)}%, signaling comprehension issues.`);
  } else if ((data.avg_marks ?? 0) >= 75) {
    positive_factors.push(`Solid average assessment score of ${data.avg_marks?.toFixed(1)}%.`);
  }

  if ((data.cgpa ?? 0) < 6.5) {
    key_concerns.push(`Cumulative CGPA is ${data.cgpa?.toFixed(2)}, below optimal placement benchmark.`);
  } else if ((data.cgpa ?? 0) >= 8.0) {
    positive_factors.push(`Outstanding CGPA of ${data.cgpa?.toFixed(2)}.`);
  }

  if ((data.assignment_completion_pct ?? 0) < 70) {
    key_concerns.push(`Assignment submission is at ${data.assignment_completion_pct?.toFixed(1)}%, indicating backlog in coursework tasks.`);
  }

  if ((data.backlogs ?? 0) > 0) {
    key_concerns.push(`Student carries ${data.backlogs} unresolved course backlog(s).`);
  }

  // Generate plain-text explainability summary
  let explanation = '';
  if (risk_category === 'High') {
    const primaryFactor = [...factors].sort((a, b) => b.weighted_points - a.weighted_points)[0];
    explanation = `Flagged for High Academic Support risk (Score: ${finalScore}/100). The primary driver is ${primaryFactor.name.toLowerCase()} contributing ${primaryFactor.weighted_points} points to the screening index. ${key_concerns.join(' ')}`;
  } else if (risk_category === 'Moderate') {
    const warningFactors = factors.filter((f) => f.status === 'Moderate' || f.status === 'Critical');
    explanation = `Moderate Risk profile (Score: ${finalScore}/100). The student maintains basic eligibility but displays early warning indicators in ${warningFactors.map((w) => w.name.toLowerCase()).join(' and ')}. Proactive mentor guidance recommended.`;
  } else {
    explanation = `Low Risk profile (Score: ${finalScore}/100). The student is performing consistently across coursework, attendance, and continuous assessments with satisfactory academic momentum.`;
  }

  return {
    student_id: data.student_id,
    student_name: data.name || data.student_id,
    risk_score: finalScore,
    risk_category,
    factors,
    explanation,
    key_concerns,
    positive_factors,
    calculated_at: new Date().toISOString(),
    disclaimer: 'NOVA Screening Assessment: This index is a deterministic screening estimate to help faculty prioritize support resources, not a guaranteed prediction of academic failure or final graduation outcome.',
  };
}
