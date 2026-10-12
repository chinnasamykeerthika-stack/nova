# NOVA – AI-Powered Student Analytics and Success Platform

A comprehensive, full-stack student academic analytics, explainable risk classification, personalized intervention, and What-If simulation system designed for collegiate faculty and academic advisors.

---

## 1. Key Features

- **Executive Analytics Dashboard**:
  - Live calculations for total cohort, average CGPA, average attendance, students needing academic support, high performers, and pending interventions.
  - Interactive Chart.js charts: CGPA histogram, Attendance vs. Marks scatter plot with risk color-coding, Department performance matrix, monthly trend tracking, and risk distribution breakdown.
  - Real-time critical alerts for students needing urgent intervention and recent faculty activity feed.
- **Student Directory & CRUD Management**:
  - Search by student name, roll number/ID, or email.
  - Multi-criteria filtering by Academic Department, Year, and Risk Category.
  - Add new student records with real-time field validation (CGPA, attendance, marks, assignments, backlogs).
  - Edit student details and delete records with safe confirmation dialogs.
  - Paginated high-density tabular view with tabular numeric alignment.
- **Explainable AI Risk Engine**:
  - Configurable, multi-factor deterministic scoring algorithm: Class Attendance (30%), Assessment Marks (25%), Cumulative CGPA (25%), Assignment Submissions (15%), and Backlog Momentum (5%).
  - Transparent factor contribution breakdown displaying weighted score impact, benchmarks, and individual indicators.
  - Documented classification boundaries: **Low Risk (0–39)**, **Moderate Risk (40–69)**, **High Risk (70–100)**.
  - Clearly labelled screening disclaimer: *Screening estimate for academic support, not a guaranteed prediction of failure*.
  - Configurable faculty settings panel with sliders to adjust risk thresholds and factor weights on the fly.
- **Personalized Success Recommendations**:
  - Automatically identifies specific root causes (e.g. attendance below 75% cutoff, failure in specific course modules, overdue coursework, multiple backlogs).
  - Outputs targeted actions, priority levels, review deadlines, and status trackers.
  - Special honors & research acceleration plans for high-performing students.
- **Comprehensive Student Profile**:
  - Individual academic history, course-by-course marks and attendance breakdown.
  - Visual factor contribution progress bars.
  - Active personalized recommendations with action buttons.
  - Past interventions and follow-up timeline.
  - Integrated "Update Academic Record" form that immediately recalculates risk scores.
- **Faculty Intervention Workflow**:
  - Create faculty-directed interventions for any student.
  - Assign mentor faculty, enter issue description, planned actions, due dates, and priority.
  - Progress tracker across **Pending**, **In Progress**, and **Completed** statuses.
  - Timestamped follow-up notes with author attribution and outcome logging.
  - Overdue task identification and historical student performance comparison.
- **What-If Academic Simulator**:
  - Sandbox simulator allowing faculty to tweak attendance, marks, CGPA, assignment rate, and backlogs.
  - Real-time side-by-side comparison of baseline vs. simulated risk scores.
  - Impact analysis highlighting which adjustments deliver the highest risk reduction.
  - "Reset Simulation" capability; never alters permanent database records.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Chart.js, Lucide Icons.
- **Live Node/Express Server**: Express running on Port 3000 with WebAssembly SQLite (`sql.js`), persistent database storage in `instance/nova.db`, and Vite middleware.
- **Python Flask Backend**: Python 3.10+, Flask REST API, SQLite (`instance/nova.db`), transparent risk analytics module (`analytics.py`), and recommendation generator (`recommendations.py`).
- **Database**: SQLite with 8 relational tables (`Students`, `AcademicRecords`, `SubjectPerformance`, `Recommendations`, `Interventions`, `Faculty`, `FollowUpNotes`, `ThresholdSettings`).

---

## 3. How to Run Locally

### Running the Live AI Studio / Node Application:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running with Python Flask (Windows / VS Code):

1. **Clone or open the repository folder in VS Code**:
   ```powershell
   cd NOVA
   ```

2. **Create and activate a Python virtual environment**:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize and seed the SQLite database**:
   ```bash
   python seed.py
   ```
   *This creates `instance/nova.db` and populates realistic demo students, subjects, faculty mentors, and interventions.*

5. **Start the Flask server**:
   ```bash
   python app.py
   ```
   *The Flask API will start on `http://127.0.0.1:5000`.*

---

## 4. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Cohort KPIs, Chart.js datasets, alerts, recent activity feed |
| `GET` | `/api/students` | Searchable & filterable student list with pagination |
| `POST` | `/api/students` | Register new student with validated academic metrics |
| `GET` | `/api/students/<id>` | Full student profile, subject details, risk factors, recommendations |
| `PUT` | `/api/students/<id>` | Update student profile & academic record; recalculates risk |
| `DELETE` | `/api/students/<id>` | Delete student record and cascading records |
| `GET` | `/api/students/<id>/risk` | Detailed explainable factor contribution breakdown |
| `GET` | `/api/students/<id>/recommendations` | Targeted personalized recommendations |
| `GET` | `/api/interventions` | List all faculty interventions with follow-up notes |
| `POST` | `/api/interventions` | Create new faculty intervention task |
| `PUT` | `/api/interventions/<id>` | Update status (Pending/In Progress/Completed) & outcome |
| `POST` | `/api/interventions/<id>/notes` | Append timestamped follow-up note to intervention |
| `POST` | `/api/simulate` | What-If sandbox calculation (does not modify database) |
| `GET` | `/api/settings/thresholds` | Retrieve current risk thresholds and factor weights |
| `PUT` | `/api/settings/thresholds` | Update risk scoring thresholds and factor weights |
| `GET` | `/api/faculty` | List department mentors and faculty advisors |
| `POST` | `/api/seed` | Reset and reload demo database |

---

## 5. Testing & Verification Checklist

1. **Dashboard Verification**:
   - Confirm KPIs match seeded students (12 total students, realistic average CGPA and attendance).
   - Verify all 5 Chart.js charts render smoothly with no console warnings.
2. **Student Directory & Search**:
   - Search for "Aiden" or "Sophia" to verify instant search filtering.
   - Filter by Department (e.g. "Computer Science") and Risk ("High").
   - Click **Add Student** to create a student; verify unique ID validation.
   - Click **View Profile** to inspect detailed subject metrics.
3. **Explainable Risk Profiling**:
   - Inspect Aiden Brooks (High Risk, 76/100) vs Sophia Patel (Low Risk, 8/100).
   - Check the individual factor contribution bars and plain-language explanation.
4. **Interventions Workflow**:
   - Navigate to Interventions tab.
   - Click **Create Intervention**, select student, assign mentor, and submit.
   - Change status to **In Progress** or **Completed**.
   - Add a follow-up note and verify timestamped log display.
5. **What-If Academic Simulator**:
   - Select student `STU-2024-001` (Aiden Brooks).
   - Increase attendance slider from 61% to 82% and marks from 48% to 68%.
   - Observe live risk score drop from 76 to 34 (High -> Low Risk).
   - Click **Reset Simulation** to confirm database record was unchanged.
