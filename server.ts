import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb, getThresholdSettings, updateThresholdSettings, seedDatabase } from './src/server/db.ts';
import { computeRiskScore } from './src/server/analytics.ts';
import { generatePersonalizedRecommendations } from './src/server/recommendations.ts';
import { Student, DashboardData, SimulationResult, SubjectPerformance, Recommendation, Intervention } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Initialize DB
  const db = await getDb();

  // Helper to query all rows as objects
  function queryAll<T = Record<string, any>>(sql: string, params: any[] = []): T[] {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  // Helper to get one row
  function queryOne<T = Record<string, any>>(sql: string, params: any[] = []): T | null {
    const rows = queryAll<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // --- API ROUTES ---

  // 1. GET /api/dashboard
  app.get('/api/dashboard', (req: Request, res: Response) => {
    try {
      const settings = getThresholdSettings(db);

      // Fetch all students with academic records
      const rawStudents = queryAll(`
        SELECT s.student_id, s.name, s.department, s.academic_year,
               r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
        FROM Students s
        LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
      `);

      let totalStudents = rawStudents.length;
      let sumCgpa = 0;
      let sumAttendance = 0;
      let needingSupport = 0;
      let performingWell = 0;

      const riskCounts: Record<string, number> = { High: 0, Moderate: 0, Low: 0 };
      const deptMap: Record<string, { totalCgpa: number; totalAtt: number; count: number }> = {};
      const scatterData: { student_id: string; name: string; attendance: number; marks: number; risk: string }[] = [];
      const criticalAlerts: DashboardData['critical_alerts'] = [];

      for (const st of rawStudents) {
        sumCgpa += Number(st.cgpa) || 0;
        sumAttendance += Number(st.attendance_pct) || 0;

        const risk = computeRiskScore(
          {
            student_id: st.student_id,
            name: st.name,
            attendance_pct: Number(st.attendance_pct),
            avg_marks: Number(st.avg_marks),
            cgpa: Number(st.cgpa),
            assignment_completion_pct: Number(st.assignment_completion_pct),
            backlogs: Number(st.backlogs),
            prev_semester_gpa: Number(st.prev_semester_gpa),
          },
          settings
        );

        riskCounts[risk.risk_category] = (riskCounts[risk.risk_category] || 0) + 1;
        if (risk.risk_category === 'High') {
          needingSupport++;
          if (criticalAlerts.length < 5) {
            criticalAlerts.push({
              id: `alert-${st.student_id}`,
              student_id: st.student_id,
              student_name: st.name,
              department: st.department,
              issue: risk.key_concerns[0] || 'High composite academic risk score',
              risk_score: risk.risk_score,
            });
          }
        } else if (risk.risk_category === 'Low' && (Number(st.cgpa) >= 8.0 || Number(st.avg_marks) >= 80)) {
          performingWell++;
        }

        scatterData.push({
          student_id: st.student_id,
          name: st.name,
          attendance: Math.round((Number(st.attendance_pct) || 0) * 10) / 10,
          marks: Math.round((Number(st.avg_marks) || 0) * 10) / 10,
          risk: risk.risk_category,
        });

        // Dept performance
        const dept = st.department || 'General';
        if (!deptMap[dept]) {
          deptMap[dept] = { totalCgpa: 0, totalAtt: 0, count: 0 };
        }
        deptMap[dept].totalCgpa += Number(st.cgpa) || 0;
        deptMap[dept].totalAtt += Number(st.attendance_pct) || 0;
        deptMap[dept].count += 1;
      }

      // Interventions count
      const pendingInterventionsRow = queryOne(`
        SELECT COUNT(*) as count FROM Interventions WHERE status != 'Completed'
      `);
      const pendingInterventions = Number(pendingInterventionsRow?.count) || 0;

      // Performance distribution histogram (bins of CGPA)
      const gpaBins = [
        { label: '< 6.0', count: 0 },
        { label: '6.0 - 6.9', count: 0 },
        { label: '7.0 - 7.9', count: 0 },
        { label: '8.0 - 8.9', count: 0 },
        { label: '9.0 - 10.0', count: 0 },
      ];
      for (const st of rawStudents) {
        const g = Number(st.cgpa) || 0;
        if (g < 6.0) gpaBins[0].count++;
        else if (g < 7.0) gpaBins[1].count++;
        else if (g < 8.0) gpaBins[2].count++;
        else if (g < 9.0) gpaBins[3].count++;
        else gpaBins[4].count++;
      }

      const deptPerformance = Object.keys(deptMap).map((d) => ({
        department: d,
        avg_cgpa: Math.round((deptMap[d].totalCgpa / deptMap[d].count) * 100) / 100,
        avg_attendance: Math.round((deptMap[d].totalAtt / deptMap[d].count) * 10) / 10,
        student_count: deptMap[d].count,
      }));

      // Monthly trends
      const monthlyTrends = [
        { month: 'Jun', avg_marks: 74.2, avg_attendance: 84.1 },
        { month: 'Jul', avg_marks: 72.8, avg_attendance: 82.5 },
        { month: 'Aug', avg_marks: 70.4, avg_attendance: 80.2 },
        { month: 'Sep', avg_marks: 68.9, avg_attendance: 78.4 },
        { month: 'Oct', avg_marks: 71.5, avg_attendance: 79.8 },
      ];

      const riskDistribution = [
        { category: 'Low Risk', count: riskCounts.Low, percentage: totalStudents ? Math.round((riskCounts.Low / totalStudents) * 100) : 0 },
        { category: 'Moderate Risk', count: riskCounts.Moderate, percentage: totalStudents ? Math.round((riskCounts.Moderate / totalStudents) * 100) : 0 },
        { category: 'High Risk', count: riskCounts.High, percentage: totalStudents ? Math.round((riskCounts.High / totalStudents) * 100) : 0 },
      ];

      // Recent activities from interventions & notes
      const recentInterventions = queryAll(`
        SELECT i.id, i.student_id, s.name as student_name, i.mentor_name, i.issue, i.created_at, i.status
        FROM Interventions i
        LEFT JOIN Students s ON i.student_id = s.student_id
        ORDER BY i.created_at DESC LIMIT 5
      `);

      const recentActivities = recentInterventions.map((ri: any) => ({
        id: `act-${ri.id}`,
        type: 'intervention' as const,
        description: `Faculty intervention created for ${ri.student_name || ri.student_id}: ${ri.issue}`,
        timestamp: ri.created_at,
        actor: ri.mentor_name,
      }));

      const dashboardData: DashboardData = {
        summary: {
          total_students: totalStudents,
          avg_cgpa: totalStudents ? Math.round((sumCgpa / totalStudents) * 100) / 100 : 0,
          avg_attendance: totalStudents ? Math.round((sumAttendance / totalStudents) * 10) / 10 : 0,
          needing_support: needingSupport,
          performing_well: performingWell,
          pending_interventions: pendingInterventions,
        },
        charts: {
          performance_distribution: gpaBins,
          attendance_vs_marks: scatterData,
          department_performance: deptPerformance,
          monthly_trends: monthlyTrends,
          risk_distribution: riskDistribution,
        },
        recent_activities: recentActivities,
        critical_alerts: criticalAlerts,
      };

      res.json(dashboardData);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      res.status(500).json({ error: 'Failed to compute dashboard analytics', details: err.message });
    }
  });

  // 2. GET /api/students (with search, filter, pagination)
  app.get('/api/students', (req: Request, res: Response) => {
    try {
      const q = ((req.query.q as string) || '').trim().toLowerCase();
      const dept = (req.query.dept as string) || '';
      const year = req.query.year ? parseInt(req.query.year as string, 10) : 0;
      const riskFilter = (req.query.risk as string) || '';
      const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : 10;

      const settings = getThresholdSettings(db);

      const raw = queryAll(`
        SELECT s.id, s.student_id, s.name, s.email, s.department, s.academic_year, s.semester, s.enrollment_date, s.status,
               r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
        FROM Students s
        LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
        ORDER BY s.id ASC
      `);

      let students: Student[] = raw.map((row: any) => {
        const risk = computeRiskScore(
          {
            student_id: row.student_id,
            name: row.name,
            attendance_pct: Number(row.attendance_pct),
            avg_marks: Number(row.avg_marks),
            cgpa: Number(row.cgpa),
            assignment_completion_pct: Number(row.assignment_completion_pct),
            backlogs: Number(row.backlogs),
            prev_semester_gpa: Number(row.prev_semester_gpa),
          },
          settings
        );

        return {
          id: row.id,
          student_id: row.student_id,
          name: row.name,
          email: row.email,
          department: row.department,
          academic_year: Number(row.academic_year),
          semester: Number(row.semester),
          enrollment_date: row.enrollment_date,
          status: row.status,
          cgpa: Number(row.cgpa) || 0,
          attendance_pct: Number(row.attendance_pct) || 0,
          avg_marks: Number(row.avg_marks) || 0,
          assignment_completion_pct: Number(row.assignment_completion_pct) || 0,
          backlogs: Number(row.backlogs) || 0,
          prev_semester_gpa: Number(row.prev_semester_gpa) || 0,
          risk_score: risk.risk_score,
          risk_category: risk.risk_category,
        };
      });

      // Apply client-side filters
      if (q) {
        students = students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.student_id.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
      }
      if (dept && dept !== 'All') {
        students = students.filter((s) => s.department === dept);
      }
      if (year && year > 0) {
        students = students.filter((s) => s.academic_year === year);
      }
      if (riskFilter && riskFilter !== 'All') {
        students = students.filter((s) => s.risk_category === riskFilter);
      }

      const total = students.length;
      const startIndex = (page - 1) * limit;
      const paginated = students.slice(startIndex, startIndex + limit);

      res.json({
        students: paginated,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error('Error fetching students:', err);
      res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
  });

  // 3. POST /api/students (Add new student with validation)
  app.post('/api/students', (req: Request, res: Response) => {
    try {
      const {
        student_id,
        name,
        email,
        department,
        academic_year,
        semester,
        enrollment_date,
        cgpa,
        attendance_pct,
        avg_marks,
        assignment_completion_pct,
        backlogs,
      } = req.body;

      if (!student_id || !name || !email || !department) {
        return res.status(400).json({ error: 'Student ID, Name, Email, and Department are required.' });
      }

      // Check unique
      const existing = queryOne('SELECT id FROM Students WHERE student_id = ?', [student_id]);
      if (existing) {
        return res.status(409).json({ error: `Student with ID "${student_id}" already exists.` });
      }

      const parsedYear = parseInt(academic_year, 10) || 1;
      const parsedSem = parseInt(semester, 10) || 1;
      const parsedEnrollment = enrollment_date || new Date().toISOString().split('T')[0];
      const parsedCgpa = parseFloat(cgpa) || 7.0;
      const parsedAtt = parseFloat(attendance_pct) || 75.0;
      const parsedMarks = parseFloat(avg_marks) || 65.0;
      const parsedAssign = parseFloat(assignment_completion_pct) || 80.0;
      const parsedBacklogs = parseInt(backlogs, 10) || 0;

      // Insert Student
      db.run(
        `INSERT INTO Students (student_id, name, email, department, academic_year, semester, enrollment_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [student_id, name, email, department, parsedYear, parsedSem, parsedEnrollment]
      );

      const nowIso = new Date().toISOString();
      // Insert AcademicRecord
      db.run(
        `INSERT INTO AcademicRecords (student_id, cgpa, attendance_pct, avg_marks, assignment_completion_pct, backlogs, prev_semester_gpa, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_id, parsedCgpa, parsedAtt, parsedMarks, parsedAssign, parsedBacklogs, parsedCgpa, nowIso]
      );

      // Generate default subjects based on department
      const sampleSubjects = [
        { code: `${department.slice(0, 2).toUpperCase()}101`, name: 'Core Foundations I', credits: 4 },
        { code: `${department.slice(0, 2).toUpperCase()}102`, name: 'Applied Mathematics & Methods', credits: 4 },
        { code: `${department.slice(0, 2).toUpperCase()}103`, name: 'Laboratory & Project Work', credits: 3 },
      ];

      for (const sub of sampleSubjects) {
        db.run(
          `INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, credits, marks_obtained, max_marks, grade, attendance_pct)
           VALUES (?, ?, ?, ?, ?, 100, ?, ?)`,
          [student_id, sub.code, sub.name, sub.credits, parsedMarks, parsedMarks >= 75 ? 'A' : parsedMarks >= 60 ? 'B' : 'C', parsedAtt]
        );
      }

      // Generate initial recommendations
      const recs = generatePersonalizedRecommendations({
        student_id,
        name,
        attendance_pct: parsedAtt,
        avg_marks: parsedMarks,
        cgpa: parsedCgpa,
        assignment_completion_pct: parsedAssign,
        backlogs: parsedBacklogs,
        prev_semester_gpa: parsedCgpa,
      });

      for (const r of recs) {
        db.run(
          `INSERT INTO Recommendations (student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.student_id, r.issue, r.explanation, r.recommended_action, r.priority, r.suggested_review_date, r.status, r.created_at]
        );
      }

      saveDb();
      res.status(201).json({ message: 'Student created successfully', student_id });
    } catch (err: any) {
      console.error('Error creating student:', err);
      res.status(500).json({ error: 'Failed to create student', details: err.message });
    }
  });

  // 4. GET /api/students/:id (Detailed student profile)
  app.get('/api/students/:id', (req: Request, res: Response) => {
    try {
      const studentIdParam = req.params.id;
      const settings = getThresholdSettings(db);

      const student = queryOne(
        `SELECT s.id, s.student_id, s.name, s.email, s.department, s.academic_year, s.semester, s.enrollment_date, s.status,
                r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa, r.updated_at
         FROM Students s
         LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
         WHERE s.student_id = ? OR s.id = ?`,
        [studentIdParam, studentIdParam]
      );

      if (!student) {
        return res.status(404).json({ error: `Student not found with ID ${studentIdParam}` });
      }

      const subjects = queryAll<SubjectPerformance>(
        `SELECT id, student_id, subject_code, subject_name, credits, marks_obtained, max_marks, grade, attendance_pct
         FROM SubjectPerformance WHERE student_id = ?`,
        [student.student_id]
      );

      const recommendations = queryAll<Recommendation>(
        `SELECT id, student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at
         FROM Recommendations WHERE student_id = ? ORDER BY id DESC`,
        [student.student_id]
      );

      const interventions = queryAll<Intervention>(
        `SELECT id, student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date, status, outcome, created_at, updated_at
         FROM Interventions WHERE student_id = ? ORDER BY id DESC`,
        [student.student_id]
      );

      // Attach notes to interventions
      for (const inter of interventions) {
        inter.notes = queryAll(
          `SELECT id, intervention_id, note, author, created_at FROM FollowUpNotes WHERE intervention_id = ? ORDER BY id ASC`,
          [inter.id]
        );
      }

      const risk = computeRiskScore(
        {
          student_id: student.student_id,
          name: student.name,
          attendance_pct: Number(student.attendance_pct),
          avg_marks: Number(student.avg_marks),
          cgpa: Number(student.cgpa),
          assignment_completion_pct: Number(student.assignment_completion_pct),
          backlogs: Number(student.backlogs),
          prev_semester_gpa: Number(student.prev_semester_gpa),
        },
        settings
      );

      res.json({
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          academic_year: Number(student.academic_year),
          semester: Number(student.semester),
          enrollment_date: student.enrollment_date,
          status: student.status,
          cgpa: Number(student.cgpa) || 0,
          attendance_pct: Number(student.attendance_pct) || 0,
          avg_marks: Number(student.avg_marks) || 0,
          assignment_completion_pct: Number(student.assignment_completion_pct) || 0,
          backlogs: Number(student.backlogs) || 0,
          prev_semester_gpa: Number(student.prev_semester_gpa) || 0,
          risk_score: risk.risk_score,
          risk_category: risk.risk_category,
        },
        subjects,
        recommendations,
        interventions,
        risk_analysis: risk,
      });
    } catch (err: any) {
      console.error('Error fetching student profile:', err);
      res.status(500).json({ error: 'Failed to fetch student profile', details: err.message });
    }
  });

  // 5. PUT /api/students/:id (Update student details & academic record)
  app.put('/api/students/:id', (req: Request, res: Response) => {
    try {
      const studentIdParam = req.params.id;
      const {
        name,
        email,
        department,
        academic_year,
        semester,
        status,
        cgpa,
        attendance_pct,
        avg_marks,
        assignment_completion_pct,
        backlogs,
        prev_semester_gpa,
      } = req.body;

      const existing = queryOne('SELECT student_id, id FROM Students WHERE student_id = ? OR id = ?', [
        studentIdParam,
        studentIdParam,
      ]);
      if (!existing) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const actualSid = existing.student_id;

      // Update Students table
      db.run(
        `UPDATE Students
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             department = COALESCE(?, department),
             academic_year = COALESCE(?, academic_year),
             semester = COALESCE(?, semester),
             status = COALESCE(?, status)
         WHERE student_id = ?`,
        [name, email, department, academic_year, semester, status, actualSid]
      );

      // Update AcademicRecords table
      const nowIso = new Date().toISOString();
      db.run(
        `UPDATE AcademicRecords
         SET cgpa = COALESCE(?, cgpa),
             attendance_pct = COALESCE(?, attendance_pct),
             avg_marks = COALESCE(?, avg_marks),
             assignment_completion_pct = COALESCE(?, assignment_completion_pct),
             backlogs = COALESCE(?, backlogs),
             prev_semester_gpa = COALESCE(?, prev_semester_gpa),
             updated_at = ?
         WHERE student_id = ?`,
        [cgpa, attendance_pct, avg_marks, assignment_completion_pct, backlogs, prev_semester_gpa, nowIso, actualSid]
      );

      // Refresh recommendations
      const updatedRec = queryOne('SELECT * FROM AcademicRecords WHERE student_id = ?', [actualSid]);
      const subjects = queryAll<SubjectPerformance>('SELECT * FROM SubjectPerformance WHERE student_id = ?', [actualSid]);
      const newRecs = generatePersonalizedRecommendations(
        {
          student_id: actualSid,
          name: name || actualSid,
          attendance_pct: Number(updatedRec?.attendance_pct),
          avg_marks: Number(updatedRec?.avg_marks),
          cgpa: Number(updatedRec?.cgpa),
          assignment_completion_pct: Number(updatedRec?.assignment_completion_pct),
          backlogs: Number(updatedRec?.backlogs),
          prev_semester_gpa: Number(updatedRec?.prev_semester_gpa),
        },
        subjects
      );

      // Replace pending recommendations
      db.run(`DELETE FROM Recommendations WHERE student_id = ? AND status = 'Pending'`, [actualSid]);
      for (const r of newRecs) {
        db.run(
          `INSERT INTO Recommendations (student_id, issue, explanation, recommended_action, priority, suggested_review_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [actualSid, r.issue, r.explanation, r.recommended_action, r.priority, r.suggested_review_date, r.status, r.created_at]
        );
      }

      saveDb();
      res.json({ message: 'Student and academic analytics updated successfully', student_id: actualSid });
    } catch (err: any) {
      console.error('Error updating student:', err);
      res.status(500).json({ error: 'Failed to update student', details: err.message });
    }
  });

  // 6. DELETE /api/students/:id
  app.delete('/api/students/:id', (req: Request, res: Response) => {
    try {
      const studentIdParam = req.params.id;
      const existing = queryOne('SELECT student_id FROM Students WHERE student_id = ? OR id = ?', [
        studentIdParam,
        studentIdParam,
      ]);
      if (!existing) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const sid = existing.student_id;
      db.run('DELETE FROM FollowUpNotes WHERE intervention_id IN (SELECT id FROM Interventions WHERE student_id = ?)', [sid]);
      db.run('DELETE FROM Interventions WHERE student_id = ?', [sid]);
      db.run('DELETE FROM Recommendations WHERE student_id = ?', [sid]);
      db.run('DELETE FROM SubjectPerformance WHERE student_id = ?', [sid]);
      db.run('DELETE FROM AcademicRecords WHERE student_id = ?', [sid]);
      db.run('DELETE FROM Students WHERE student_id = ?', [sid]);

      saveDb();
      res.json({ message: `Student record ${sid} deleted successfully` });
    } catch (err: any) {
      console.error('Error deleting student:', err);
      res.status(500).json({ error: 'Failed to delete student', details: err.message });
    }
  });

  // 7. GET /api/students/:id/risk
  app.get('/api/students/:id/risk', (req: Request, res: Response) => {
    try {
      const studentIdParam = req.params.id;
      const settings = getThresholdSettings(db);

      const st = queryOne(
        `SELECT s.student_id, s.name, r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
         FROM Students s
         LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
         WHERE s.student_id = ? OR s.id = ?`,
        [studentIdParam, studentIdParam]
      );

      if (!st) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const risk = computeRiskScore(
        {
          student_id: st.student_id,
          name: st.name,
          attendance_pct: Number(st.attendance_pct),
          avg_marks: Number(st.avg_marks),
          cgpa: Number(st.cgpa),
          assignment_completion_pct: Number(st.assignment_completion_pct),
          backlogs: Number(st.backlogs),
          prev_semester_gpa: Number(st.prev_semester_gpa),
        },
        settings
      );

      res.json(risk);
    } catch (err: any) {
      console.error('Error computing risk:', err);
      res.status(500).json({ error: 'Failed to compute risk score', details: err.message });
    }
  });

  // 8. GET /api/students/:id/recommendations
  app.get('/api/students/:id/recommendations', (req: Request, res: Response) => {
    try {
      const studentIdParam = req.params.id;
      const st = queryOne('SELECT student_id FROM Students WHERE student_id = ? OR id = ?', [studentIdParam, studentIdParam]);
      if (!st) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const recs = queryAll<Recommendation>(
        'SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC',
        [st.student_id]
      );
      res.json(recs);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      res.status(500).json({ error: 'Failed to fetch recommendations', details: err.message });
    }
  });

  // 9. GET /api/interventions (with filter)
  app.get('/api/interventions', (req: Request, res: Response) => {
    try {
      const statusFilter = (req.query.status as string) || '';
      const priorityFilter = (req.query.priority as string) || '';

      const rows = queryAll<any>(`
        SELECT i.id, i.student_id, s.name as student_name, s.department,
               i.mentor_name, i.mentor_email, i.issue, i.planned_action, i.priority, i.due_date, i.status, i.outcome,
               i.created_at, i.updated_at,
               r.cgpa as cgpa_before, r.attendance_pct as attendance_before
        FROM Interventions i
        LEFT JOIN Students s ON i.student_id = s.student_id
        LEFT JOIN AcademicRecords r ON i.student_id = r.student_id
        ORDER BY i.created_at DESC
      `);

      for (const row of rows) {
        row.notes = queryAll(
          `SELECT id, intervention_id, note, author, created_at FROM FollowUpNotes WHERE intervention_id = ? ORDER BY id ASC`,
          [row.id]
        );
      }

      let filtered = rows;
      if (statusFilter && statusFilter !== 'All') {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
      if (priorityFilter && priorityFilter !== 'All') {
        filtered = filtered.filter((r) => r.priority === priorityFilter);
      }

      res.json(filtered);
    } catch (err: any) {
      console.error('Error fetching interventions:', err);
      res.status(500).json({ error: 'Failed to fetch interventions', details: err.message });
    }
  });

  // 10. POST /api/interventions (Create intervention)
  app.post('/api/interventions', (req: Request, res: Response) => {
    try {
      const { student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date } = req.body;

      if (!student_id || !mentor_name || !issue || !planned_action || !due_date) {
        return res.status(400).json({ error: 'Student ID, Mentor, Issue, Planned Action, and Due Date are required.' });
      }

      const st = queryOne('SELECT student_id FROM Students WHERE student_id = ?', [student_id]);
      if (!st) {
        return res.status(404).json({ error: `Student ${student_id} not found.` });
      }

      const nowIso = new Date().toISOString();
      db.run(
        `INSERT INTO Interventions (student_id, mentor_name, mentor_email, issue, planned_action, priority, due_date, status, outcome, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?, ?)`,
        [student_id, mentor_name, mentor_email || 'mentor@nova.edu', issue, planned_action, priority || 'Medium', due_date, nowIso, nowIso]
      );

      saveDb();
      res.status(201).json({ message: 'Intervention created successfully' });
    } catch (err: any) {
      console.error('Error creating intervention:', err);
      res.status(500).json({ error: 'Failed to create intervention', details: err.message });
    }
  });

  // 11. PUT /api/interventions/:id (Update intervention status/outcome)
  app.put('/api/interventions/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, outcome, planned_action, priority, due_date } = req.body;

      const inter = queryOne('SELECT id FROM Interventions WHERE id = ?', [id]);
      if (!inter) {
        return res.status(404).json({ error: 'Intervention not found' });
      }

      const nowIso = new Date().toISOString();
      db.run(
        `UPDATE Interventions
         SET status = COALESCE(?, status),
             outcome = COALESCE(?, outcome),
             planned_action = COALESCE(?, planned_action),
             priority = COALESCE(?, priority),
             due_date = COALESCE(?, due_date),
             updated_at = ?
         WHERE id = ?`,
        [status, outcome, planned_action, priority, due_date, nowIso, id]
      );

      saveDb();
      res.json({ message: 'Intervention updated successfully' });
    } catch (err: any) {
      console.error('Error updating intervention:', err);
      res.status(500).json({ error: 'Failed to update intervention', details: err.message });
    }
  });

  // 12. POST /api/interventions/:id/notes (Add follow-up note)
  app.post('/api/interventions/:id/notes', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { note, author } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({ error: 'Note content cannot be empty' });
      }

      const inter = queryOne('SELECT id FROM Interventions WHERE id = ?', [id]);
      if (!inter) {
        return res.status(404).json({ error: 'Intervention not found' });
      }

      const nowIso = new Date().toISOString();
      db.run(
        `INSERT INTO FollowUpNotes (intervention_id, note, author, created_at)
         VALUES (?, ?, ?, ?)`,
        [id, note.trim(), author || 'Faculty Mentor', nowIso]
      );

      // Touch updated_at on intervention
      db.run('UPDATE Interventions SET updated_at = ? WHERE id = ?', [nowIso, id]);

      saveDb();
      res.status(201).json({ message: 'Follow-up note added successfully' });
    } catch (err: any) {
      console.error('Error adding note:', err);
      res.status(500).json({ error: 'Failed to add follow-up note', details: err.message });
    }
  });

  // 13. POST /api/simulate (What-If Academic Simulator - NEVER mutates database!)
  app.post('/api/simulate', (req: Request, res: Response) => {
    try {
      const {
        student_id,
        simulated_attendance,
        simulated_marks,
        simulated_cgpa,
        simulated_assignment,
        simulated_backlogs,
      } = req.body;

      const settings = getThresholdSettings(db);

      // Current values
      let currentRecord = {
        student_id: student_id || 'SIM-TEST',
        name: 'Hypothetical Student',
        attendance_pct: 65.0,
        avg_marks: 54.0,
        cgpa: 5.80,
        assignment_completion_pct: 60.0,
        backlogs: 2,
        prev_semester_gpa: 6.50,
      };

      if (student_id) {
        const row = queryOne(
          `SELECT s.student_id, s.name, r.cgpa, r.attendance_pct, r.avg_marks, r.assignment_completion_pct, r.backlogs, r.prev_semester_gpa
           FROM Students s
           LEFT JOIN AcademicRecords r ON s.student_id = r.student_id
           WHERE s.student_id = ?`,
          [student_id]
        );
        if (row) {
          currentRecord = {
            student_id: row.student_id,
            name: row.name,
            attendance_pct: Number(row.attendance_pct) || 0,
            avg_marks: Number(row.avg_marks) || 0,
            cgpa: Number(row.cgpa) || 0,
            assignment_completion_pct: Number(row.assignment_completion_pct) || 0,
            backlogs: Number(row.backlogs) || 0,
            prev_semester_gpa: Number(row.prev_semester_gpa) || 0,
          };
        }
      }

      // Compute current risk
      const currentRisk = computeRiskScore(currentRecord, settings);

      // Prepare simulated record
      const simAtt = simulated_attendance !== undefined ? parseFloat(simulated_attendance) : currentRecord.attendance_pct;
      const simMarks = simulated_marks !== undefined ? parseFloat(simulated_marks) : currentRecord.avg_marks;
      const simCgpa = simulated_cgpa !== undefined ? parseFloat(simulated_cgpa) : currentRecord.cgpa;
      const simAssign = simulated_assignment !== undefined ? parseFloat(simulated_assignment) : currentRecord.assignment_completion_pct;
      const simBacklogs = simulated_backlogs !== undefined ? parseInt(simulated_backlogs, 10) : currentRecord.backlogs;

      const simulatedRecord = {
        ...currentRecord,
        attendance_pct: simAtt,
        avg_marks: simMarks,
        cgpa: simCgpa,
        assignment_completion_pct: simAssign,
        backlogs: simBacklogs,
      };

      const simulatedRisk = computeRiskScore(simulatedRecord, settings);
      const scoreDiff = simulatedRisk.risk_score - currentRisk.risk_score;

      const changedFactors = [
        {
          factor: 'Attendance',
          current: currentRecord.attendance_pct,
          simulated: simAtt,
          difference: Math.round((simAtt - currentRecord.attendance_pct) * 10) / 10,
          unit: '%',
        },
        {
          factor: 'Average Assessment Marks',
          current: currentRecord.avg_marks,
          simulated: simMarks,
          difference: Math.round((simMarks - currentRecord.avg_marks) * 10) / 10,
          unit: '%',
        },
        {
          factor: 'CGPA',
          current: currentRecord.cgpa,
          simulated: simCgpa,
          difference: Math.round((simCgpa - currentRecord.cgpa) * 100) / 100,
          unit: ' / 10',
        },
        {
          factor: 'Assignment Completion',
          current: currentRecord.assignment_completion_pct,
          simulated: simAssign,
          difference: Math.round((simAssign - currentRecord.assignment_completion_pct) * 10) / 10,
          unit: '%',
        },
        {
          factor: 'Active Backlogs',
          current: currentRecord.backlogs,
          simulated: simBacklogs,
          difference: simBacklogs - currentRecord.backlogs,
          unit: ' courses',
        },
      ];

      const suggestedNextSteps: string[] = [];
      if (simAtt >= 75 && currentRecord.attendance_pct < 75) {
        suggestedNextSteps.push(`Target attending at least 90% of classes over next 3 weeks to move overall attendance above 75%.`);
      }
      if (simMarks >= 65 && currentRecord.avg_marks < 65) {
        suggestedNextSteps.push(`Focus on internal test 2 scoring +15 marks in weaker modules to bring composite average up.`);
      }
      if (simBacklogs === 0 && currentRecord.backlogs > 0) {
        suggestedNextSteps.push(`Register for the upcoming special supplementary window to clear ${currentRecord.backlogs} pending paper(s).`);
      }
      if (scoreDiff < 0) {
        suggestedNextSteps.push(`These targeted improvements reduce calculated risk by ${Math.abs(scoreDiff)} points, shifting student trajectory towards ${simulatedRisk.risk_category} risk.`);
      } else if (scoreDiff > 0) {
        suggestedNextSteps.push(`Warning: this hypothetical scenario increases support risk by ${scoreDiff} points.`);
      } else {
        suggestedNextSteps.push(`No net change in hypothetical risk score.`);
      }

      let impactSummary = '';
      if (scoreDiff < -15) {
        impactSummary = `Significant Positive Shift: Risk score drops by ${Math.abs(scoreDiff)} points (from ${currentRisk.risk_score} to ${simulatedRisk.risk_score}). Moves student into ${simulatedRisk.risk_category} Risk category.`;
      } else if (scoreDiff < 0) {
        impactSummary = `Moderate Positive Gain: Risk score decreases by ${Math.abs(scoreDiff)} points.`;
      } else if (scoreDiff > 0) {
        impactSummary = `Risk Escalation: Score rises by ${scoreDiff} points to ${simulatedRisk.risk_score}.`;
      } else {
        impactSummary = `Baseline Match: Risk score remains unchanged at ${currentRisk.risk_score}.`;
      }

      const result: SimulationResult = {
        current_risk: currentRisk,
        simulated_risk: simulatedRisk,
        score_difference: scoreDiff,
        impact_summary: impactSummary,
        changed_factors: changedFactors,
        suggested_next_steps: suggestedNextSteps,
      };

      res.json(result);
    } catch (err: any) {
      console.error('Error running simulator:', err);
      res.status(500).json({ error: 'Failed to run simulation', details: err.message });
    }
  });

  // 14. GET & PUT /api/settings/thresholds (Configurable Risk Thresholds)
  app.get('/api/settings/thresholds', (req: Request, res: Response) => {
    try {
      const settings = getThresholdSettings(db);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get threshold settings' });
    }
  });

  app.put('/api/settings/thresholds', (req: Request, res: Response) => {
    try {
      const { low_threshold, high_threshold, attendance_weight, marks_weight, cgpa_weight, assignment_weight, trend_weight } = req.body;

      const newSettings = {
        low_threshold: parseFloat(low_threshold) || 40,
        high_threshold: parseFloat(high_threshold) || 70,
        attendance_weight: parseFloat(attendance_weight) || 0.30,
        marks_weight: parseFloat(marks_weight) || 0.25,
        cgpa_weight: parseFloat(cgpa_weight) || 0.25,
        assignment_weight: parseFloat(assignment_weight) || 0.15,
        trend_weight: parseFloat(trend_weight) || 0.05,
      };

      updateThresholdSettings(db, newSettings);
      res.json({ message: 'Risk thresholds updated successfully', settings: newSettings });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // 15. GET /api/faculty
  app.get('/api/faculty', (req: Request, res: Response) => {
    try {
      const faculty = queryAll('SELECT id, name, email, department, role FROM Faculty ORDER BY name ASC');
      res.json(faculty);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch faculty list' });
    }
  });

  // 16. POST /api/seed (Reset database to demo dataset)
  app.post('/api/seed', (req: Request, res: Response) => {
    try {
      seedDatabase(db);
      saveDb();
      res.json({ message: 'Database reseeded successfully with demo records.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reseed database' });
    }
  });

  // --- Vite Dev Server Middleware or Static Build Serving ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
