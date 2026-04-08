import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const facultySections = [
  { key: "dashboard", label: "Dashboard" },
  { key: "students", label: "Students" },
  { key: "schedule", label: "Schedule" },
  { key: "profile", label: "Profile" },
];

function toNumber(value) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function FacultyDashboard({
  departmentKey,
  activeSection = "dashboard",
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const content = getDepartmentContent(departmentKey);
  const [students, setStudents] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [studentAccountForm, setStudentAccountForm] = useState({ regno: "" });
  const [studentSubmitMessage, setStudentSubmitMessage] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const department = content?.studentDepartments?.[0];
        const [studentResponse, facultyResponse, studentAccountResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/students/`, {
            credentials: "include",
          }),
          department
            ? fetch(
                `${API_BASE_URL}/faculty-accounts/?department=${encodeURIComponent(department)}`,
                {
                  credentials: "include",
                }
              )
            : Promise.resolve({ ok: true, json: async () => [] }),
          department
            ? fetch(
                `${API_BASE_URL}/student-accounts/?department=${encodeURIComponent(department)}`,
                {
                  credentials: "include",
                }
              )
            : Promise.resolve({ ok: true, json: async () => [] }),
        ]);

        if (!studentResponse.ok || !facultyResponse.ok || !studentAccountResponse.ok) {
          throw new Error("Unable to load faculty dashboard data.");
        }

        const studentRecords = await studentResponse.json();
        const facultyRecords = await facultyResponse.json();
        const studentAccountRecords = await studentAccountResponse.json();
        const allowedDepartments = content?.studentDepartments || [];

        setStudents(
          studentRecords.filter((student) => allowedDepartments.includes(student.department))
        );
        setFacultyMembers(facultyRecords);
        setStudentAccounts(studentAccountRecords);
      } catch (error) {
        setLoadError(error.message || "Unable to load faculty dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    if (content) {
      loadDashboardData();
    }
  }, [content]);

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const eligibleStudents = students.filter(
      (student) => String(student.eligibility || "").toLowerCase() === "eligible"
    ).length;
    const placedStudents = students.filter(
      (student) => String(student.placement || "").trim() !== ""
    ).length;
    const averageCgpa = totalStudents
      ? (
          students.reduce((sum, student) => sum + toNumber(student.cgpa), 0) /
          totalStudents
        ).toFixed(2)
      : "0.00";
    const productivity = totalStudents
      ? Math.round((eligibleStudents / totalStudents) * 100)
      : 0;

    return {
      totalStudents,
      eligibleStudents,
      placedStudents,
      averageCgpa,
      productivity,
    };
  }, [students]);

  const facultyRecord =
    facultyMembers.find(
      (member) =>
        String(member.fac_username || "").trim().toLowerCase() ===
        String(currentUser?.username || "").trim().toLowerCase()
    ) || null;

  const buildFacultyPage = (section) => `faculty:${departmentKey}:${section}`;
  const overviewCards = [
    {
      title: "Student Review",
      day: "Mon",
      number: "18",
      value: `${metrics.productivity}%`,
      detail: `${metrics.eligibleStudents} eligible students`,
      tone: "lime",
    },
    {
      title: "Placement Focus",
      day: "Tue",
      number: "19",
      value: `${metrics.placedStudents}`,
      detail: "placed profiles tracked",
      tone: "mint",
    },
    {
      title: "Academic Review",
      day: "Wed",
      number: "20",
      value: metrics.averageCgpa,
      detail: "department average CGPA",
      tone: "teal",
    },
  ];

  const scheduleItems = [
    { title: "Resume Review Session", time: "09:30 AM", note: "Working on student profiles" },
    { title: "Mock Interview Slot", time: "10:40 AM", note: "Technical preparation" },
    { title: "Placement Status Update", time: "11:50 AM", note: "Tracking company progress" },
  ];

  const renderPanel = () => {
    if (isLoading) {
      return (
        <section className="faculty-surface-card">
          <h2>Loading faculty dashboard...</h2>
        </section>
      );
    }

    if (loadError) {
      return (
        <section className="faculty-surface-card">
          <h2>Faculty Dashboard</h2>
          <p className="portal-page-text">{loadError}</p>
        </section>
      );
    }

    if (activeSection === "students") {
      return (
        <div className="faculty-panel-stack">
          <section className="faculty-surface-card">
            <p className="portal-page-tag">Student Accounts</p>
            <h2>Add Student Register Numbers</h2>
            <p className="portal-page-text">
              Add student register numbers here. The register number becomes the
              student username and the default password is 12345678 until first login.
            </p>
          </section>

          <section className="faculty-surface-card">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="student-regno">Register Number</label>
                <input
                  id="student-regno"
                  type="text"
                  value={studentAccountForm.regno}
                  onChange={(event) =>
                    setStudentAccountForm({ regno: event.target.value.toUpperCase() })
                  }
                  placeholder="Enter student register number"
                />
              </div>
            </div>
            <div className="form-navigation">
              <div className="portal-page-text">
                {studentSubmitMessage ||
                  "Students must be approved by the HOD before they can log in."}
              </div>
              <button
                type="button"
                disabled={isSubmittingStudent}
                onClick={async () => {
                  const regno = studentAccountForm.regno.trim().toUpperCase();
                  const department = content?.studentDepartments?.[0] || "";
                  if (!regno || !department) {
                    setStudentSubmitMessage("Register number is required.");
                    return;
                  }
                  try {
                    setIsSubmittingStudent(true);
                    setStudentSubmitMessage("");
                    const response = await fetch(`${API_BASE_URL}/student-accounts/`, {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        regno,
                        department,
                        addedBy: currentUser?.username || "",
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.detail || "Unable to add student account.");
                    }
                    setStudentAccounts((current) => [data, ...current]);
                    setStudentAccountForm({ regno: "" });
                    setStudentSubmitMessage("Student account added and sent for HOD approval.");
                  } catch (error) {
                    setStudentSubmitMessage(error.message || "Unable to add student account.");
                  } finally {
                    setIsSubmittingStudent(false);
                  }
                }}
              >
                {isSubmittingStudent ? "Saving..." : "Add Student"}
              </button>
            </div>
          </section>

          <section className="faculty-surface-card">
            <h3>Student Login Records</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Approval</th>
                    <th>First Login</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAccounts.length ? (
                    studentAccounts.map((student) => (
                      <tr key={student.id || student.username}>
                        <td>{student.username}</td>
                        <td>{student.approval_status || "pending"}</td>
                        <td>{student.must_change_password ? "Pending" : "Completed"}</td>
                        <td>{student.department || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No student login records added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="faculty-surface-card">
            <h3>Submitted Student Details</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Register No</th>
                    <th>CGPA</th>
                    <th>Eligibility</th>
                    <th>Placement</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.regno}>
                      <td>{`${student.firstName || ""} ${student.lastName || ""}`.trim()}</td>
                      <td>{student.regno}</td>
                      <td>{student.cgpa || "-"}</td>
                      <td>{student.eligibility || "-"}</td>
                      <td>{student.placement || "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === "schedule") {
      return (
        <div className="faculty-panel-stack">
          <section className="faculty-surface-card">
            <p className="portal-page-tag">Upcoming Schedule</p>
            <h2>Faculty Activity Planner</h2>
          </section>
          <section className="faculty-surface-card">
            <div className="faculty-schedule-list">
              {scheduleItems.map((item) => (
                <article className="faculty-schedule-card" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span>{item.time}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <div className="faculty-panel-stack">
          <section className="faculty-surface-card">
            <p className="portal-page-tag">Faculty Profile</p>
            <h2>{facultyRecord?.name || currentUser?.username || "Faculty Member"}</h2>
            <p className="portal-page-text">
              {facultyRecord?.position || "Faculty Member"} in {content.title}
            </p>
          </section>
          <section className="faculty-profile-grid">
            <article className="faculty-profile-card">
              <span>Department</span>
              <strong>{facultyRecord?.department || content.studentDepartments?.[0] || "-"}</strong>
            </article>
            <article className="faculty-profile-card">
              <span>Degree</span>
              <strong>{facultyRecord?.degree || "-"}</strong>
            </article>
            <article className="faculty-profile-card">
              <span>Students Tracked</span>
              <strong>{metrics.totalStudents}</strong>
            </article>
          </section>
        </div>
      );
    }

    return (
      <div className="faculty-panel-stack">
        <section className="faculty-hero-card">
          <div className="faculty-hero-main">
            <div className="faculty-hero-copy">
              <p className="portal-page-tag">Faculty Workspace</p>
              <h1>Working Productivity</h1>
              <p className="faculty-hero-text">
                Track placement readiness, student momentum, and daily review progress
                for {content.title}.
              </p>
            </div>
            <div className="faculty-hero-search">
              <input type="text" placeholder="Search for anything..." />
            </div>
          </div>

          <div className="faculty-overview-grid">
            <div className="faculty-task-stack">
              {overviewCards.map((card) => (
                <article className={`faculty-task-card faculty-task-card-${card.tone}`} key={card.title}>
                  <div className="faculty-task-date">
                    <span>{card.day}</span>
                    <strong>{card.number}</strong>
                  </div>
                  <div className="faculty-task-copy">
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </div>
                </article>
              ))}
            </div>

            <article className="faculty-stats-card">
              <h3>Statistics</h3>
              <div className="faculty-stats-ring">
                <div className="faculty-stats-ring-core">
                  <strong>{metrics.productivity}%</strong>
                  <span>Ready</span>
                </div>
              </div>
              <div className="faculty-stat-bars">
                <div className="faculty-stat-bar-row">
                  <span>Eligible</span>
                  <strong>{metrics.eligibleStudents}</strong>
                </div>
                <div className="faculty-stat-bar-row">
                  <span>Placed</span>
                  <strong>{metrics.placedStudents}</strong>
                </div>
                <div className="faculty-stat-bar-row">
                  <span>Average CGPA</span>
                  <strong>{metrics.averageCgpa}</strong>
                </div>
              </div>
            </article>

            <aside className="faculty-profile-hero">
              <div className="faculty-profile-avatar">
                {String(facultyRecord?.name || currentUser?.username || "F")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <h3>{facultyRecord?.name || currentUser?.username || "Faculty"}</h3>
              <p>{facultyRecord?.position || "Faculty Member"}</p>
              <button type="button">Edit Profile</button>
              <div className="faculty-profile-hours">
                <div>
                  <span>Work Start</span>
                  <strong>09:00 am</strong>
                </div>
                <div>
                  <span>Work End</span>
                  <strong>05:00 pm</strong>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="faculty-bottom-grid">
          <article className="faculty-surface-card">
            <h3>Upcoming Activity</h3>
            <div className="faculty-activity-list">
              <div className="faculty-activity-row">
                <span>Tue</span>
                <strong>Resume Screening</strong>
              </div>
              <div className="faculty-activity-row">
                <span>Wed</span>
                <strong>Mentor Coordination</strong>
              </div>
              <div className="faculty-activity-row">
                <span>Thu</span>
                <strong>Placement Readiness Review</strong>
              </div>
            </div>
          </article>

          <article className="faculty-surface-card">
            <h3>Upcoming Schedule</h3>
            <div className="faculty-schedule-list">
              {scheduleItems.map((item) => (
                <article className="faculty-schedule-card" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span>{item.time}</span>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    );
  };

  return (
    <PortalLayout
      currentPage=""
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
      hideHeaderAuth
      contentClassName="portal-wide-layout"
    >
      <div className="admin-dashboard-shell faculty-dashboard-shell">
        <aside className="admin-sidebar faculty-sidebar">
          <div className="admin-sidebar-brand">
            <p className="admin-sidebar-tag">{content?.sidebarTitle || departmentKey.toUpperCase()}</p>
            <h2>Faculty Panel</h2>
          </div>

          <nav className="admin-sidebar-nav">
            {facultySections.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar-link ${activeSection === item.key ? "active" : ""}`}
                onClick={() => onNavigate(buildFacultyPage(item.key))}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button type="button" className="admin-sidebar-profile-trigger">
              <div className="admin-sidebar-avatar">
                {String(facultyRecord?.name || currentUser?.username || "F")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="admin-sidebar-profile-copy">
                <span className="admin-sidebar-profile-title">
                  {facultyRecord?.name || currentUser?.username || "Faculty"}
                </span>
                <span className="admin-sidebar-profile-subtitle">
                  {facultyRecord?.position || "Faculty Member"}
                </span>
              </div>
            </button>
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </aside>

        <div className="admin-dashboard-main">{renderPanel()}</div>
      </div>
    </PortalLayout>
  );
}

export default FacultyDashboard;
