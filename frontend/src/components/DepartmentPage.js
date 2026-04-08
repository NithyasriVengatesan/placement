import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function toNumber(value) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function DepartmentPage({
  departmentKey,
  activeSection = "overview",
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const content = getDepartmentContent(departmentKey);
  const [students, setStudents] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isFacultyLoading, setIsFacultyLoading] = useState(true);
  const [facultyLoadError, setFacultyLoadError] = useState("");

  useEffect(() => {
    const loadDepartmentStudents = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/students/`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to load student details.");
        }

        const records = await response.json();
        const allowedDepartments = content?.studentDepartments || [];
        setStudents(
          records.filter((student) => allowedDepartments.includes(student.department))
        );
      } catch (error) {
        setLoadError(error.message || "Unable to load department students.");
      } finally {
        setIsLoading(false);
      }
    };

    if (content) {
      loadDepartmentStudents();
    }
  }, [content]);

  useEffect(() => {
    const loadFacultyAccounts = async () => {
      try {
        setIsFacultyLoading(true);
        setFacultyLoadError("");
        const department = content?.studentDepartments?.[0];
        if (!department) {
          setFacultyMembers([]);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/faculty-accounts/?department=${encodeURIComponent(department)}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load faculty details.");
        }

        const records = await response.json();
        setFacultyMembers(records);
      } catch (error) {
        setFacultyLoadError(error.message || "Unable to load faculty details.");
      } finally {
        setIsFacultyLoading(false);
      }
    };

    if (content) {
      loadFacultyAccounts();
    }
  }, [content]);

  if (!content) {
    return (
      <PortalLayout
        currentPage=""
        onNavigate={onNavigate}
        onOpenStudentForm={onOpenStudentForm}
        onOpenLogin={onOpenLogin}
        currentUser={currentUser}
        onLogout={onLogout}
      >
        <section className="portal-page-card">
          <p className="portal-page-tag">Department Page</p>
          <h1>Department Page Unavailable</h1>
          <p className="portal-page-text">
            This department page is not configured yet. Add its content in the shared
            department configuration to enable it.
          </p>
        </section>
      </PortalLayout>
    );
  }

  const placedStudents = students.filter(
    (student) => String(student.placement || "").trim() !== ""
  ).length;
  const eligibleStudents = students.filter(
    (student) => String(student.eligibility || "").toLowerCase() === "eligible"
  ).length;
  const averageCgpa = students.length
    ? (
        students.reduce((total, student) => total + toNumber(student.cgpa), 0) /
        students.length
      ).toFixed(2)
    : "0.00";
  const hodRecord = facultyMembers[0] || null;
  const buildDepartmentPage = (section) => `department:${departmentKey}:${section}`;

  const renderActiveSection = () => {
    if (activeSection === "faculty") {
      return (
        <section className="dashboard-card">
            <h3>Faculty Details</h3>
          <div className="department-detail-grid">
            {isFacultyLoading ? (
              <article className="department-detail-card">
                <h4>Loading faculty details...</h4>
                <p>Please wait while the department faculty list loads.</p>
              </article>
            ) : facultyLoadError ? (
              <article className="department-detail-card">
                <h4>Unable to load faculty details</h4>
                <p>{facultyLoadError}</p>
              </article>
            ) : facultyMembers.length ? (
              facultyMembers.map((member) => (
                <article
                  className="department-detail-card"
                  key={member.id || member.fac_username}
                >
                  <h4>{member.name || member.fac_username}</h4>
                  <p>{member.position || "Faculty Account"}</p>
                  {member.degree ? (
                    <p className="department-detail-meta">Degree: {member.degree}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <article className="department-detail-card">
                <h4>No faculty added yet</h4>
                <p>Faculty accounts created from the HOD dashboard will appear here.</p>
              </article>
            )}
          </div>
        </section>
      );
    }

    if (activeSection === "students") {
      return (
        <section className="dashboard-card">
          <div className="admin-card-headline">
            <div>
              <h3>Student Details</h3>
              <p>Student records submitted through the placement form for this department.</p>
            </div>
          </div>

          {isLoading ? (
            <p className="portal-page-text">Loading student details...</p>
          ) : loadError ? (
            <p className="portal-page-text">{loadError}</p>
          ) : students.length ? (
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
          ) : (
            <p className="portal-page-text">
              No student records are available yet for this department.
            </p>
          )}
        </section>
      );
    }

    if (activeSection === "login") {
      return (
        <section className="dashboard-card">
          <div className="admin-card-headline">
            <div>
              <h3>Department Login</h3>
            </div>
          </div>

          <div className="department-login-grid">
            <button
              type="button"
              className="department-login-button"
              onClick={() =>
                onOpenLogin({
                  portalType: "department",
                  departmentRole: "hod",
                  hodOnly: true,
                  departmentKey,
                })
              }
            >
              HOD Login
            </button>
            <button
              type="button"
              className="department-login-button"
              onClick={() =>
                onOpenLogin({
                  portalType: "department",
                  departmentRole: "faculty",
                  departmentKey,
                })
              }
            >
              Faculty Login
            </button>
            <button
              type="button"
              className="department-login-button"
              onClick={() =>
                onOpenLogin({
                  portalType: "department",
                  departmentRole: "mentor",
                  departmentKey,
                })
              }
            >
              Mentor Login
            </button>
            <button
              type="button"
              className="department-login-button"
              onClick={() =>
                onOpenLogin({
                  portalType: "department",
                  departmentRole: "student",
                  studentOnly: true,
                  departmentKey,
                })
              }
            >
              Student Login
            </button>
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="portal-page-card">
          <p className="portal-page-tag">Department Dashboard</p>
          <h1>{content.title}</h1>
          <p className="portal-page-text">
            Placement dashboard for {content.title}. This homepage highlights the
            department placement snapshot and head of department details.
          </p>
        </section>

        <section className="department-stat-grid">
          <article className="department-stat-card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </article>
          <article className="department-stat-card">
            <span>Eligible Students</span>
            <strong>{eligibleStudents}</strong>
          </article>
          <article className="department-stat-card">
            <span>Placed Students</span>
            <strong>{placedStudents}</strong>
          </article>
          <article className="department-stat-card">
            <span>Average CGPA</span>
            <strong>{averageCgpa}</strong>
          </article>
        </section>

        {hodRecord ? (
          <section className="dashboard-card">
            <h3>Head of the Department</h3>
            <div className="department-detail-grid">
              <article className="department-detail-card">
                <h4>{hodRecord.fac_username}</h4>
                <p>Latest faculty account added</p>
                <p className="department-detail-meta">{hodRecord.department}</p>
              </article>
            </div>
          </section>
        ) : null}
      </>
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
    >
      <div className="department-layout">
        <aside className="department-sidebar">
          <div className="department-sidebar-card department-sidebar-card-compact">
            <p className="department-sidebar-title">{content.sidebarTitle || departmentKey.toUpperCase()}</p>
          </div>

          <nav className="department-sidebar-nav">
            <button
              type="button"
              className={`department-nav-button ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => onNavigate(buildDepartmentPage("overview"))}
            >
              Overview
            </button>
            <button
              type="button"
              className={`department-nav-button ${activeSection === "faculty" ? "active" : ""}`}
              onClick={() => onNavigate(buildDepartmentPage("faculty"))}
            >
              Faculty Details
            </button>
            <button
              type="button"
              className={`department-nav-button ${activeSection === "students" ? "active" : ""}`}
              onClick={() => onNavigate(buildDepartmentPage("students"))}
            >
              Student Details
            </button>
            <button
              type="button"
              className={`department-nav-button ${activeSection === "login" ? "active" : ""}`}
              onClick={() => onNavigate(buildDepartmentPage("login"))}
            >
              Login
            </button>
          </nav>

          {currentUser ? (
            <div className="department-sidebar-footer">
              <div className="department-sidebar-profile">
                <div className="department-sidebar-avatar">
                  {String(currentUser.username || "D").charAt(0).toUpperCase()}
                </div>
                <div className="department-sidebar-profile-copy">
                  <span className="department-sidebar-profile-title">
                    {currentUser.username}
                  </span>
                  <span className="department-sidebar-profile-subtitle">
                    Department Access
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="department-sidebar-logout"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : null}
        </aside>

        <div className="department-main">{renderActiveSection()}</div>
      </div>
    </PortalLayout>
  );
}

export default DepartmentPage;
