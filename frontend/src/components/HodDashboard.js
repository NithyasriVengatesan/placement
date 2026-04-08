import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const hodSections = [
  { key: "dashboard", label: "Dashboard" },
  { key: "approvals", label: "Approvals" },
  { key: "faculty", label: "Faculty" },
  { key: "students", label: "Students" },
  { key: "reports", label: "Reports" },
];

function toNumber(value) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function HodDashboard({
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
  const [isFacultyLoading, setIsFacultyLoading] = useState(true);
  const [facultyLoadError, setFacultyLoadError] = useState("");
  const [facultyForm, setFacultyForm] = useState({
    name: "",
    degree: "",
    position: "",
  });
  const [facultySubmitMessage, setFacultySubmitMessage] = useState("");
  const [isSubmittingFaculty, setIsSubmittingFaculty] = useState(false);
  const [deletingFacultyId, setDeletingFacultyId] = useState("");
  const [approvingStudentId, setApprovingStudentId] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");

  useEffect(() => {
    const loadDepartmentStudents = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/students/`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to load HOD dashboard data.");
        }

        const records = await response.json();
        const allowedDepartments = content?.studentDepartments || [];
        setStudents(
          records.filter((student) => allowedDepartments.includes(student.department))
        );
      } catch (error) {
        setLoadError(error.message || "Unable to load HOD dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    if (content) {
      loadDepartmentStudents();
    }
  }, [content]);

  useEffect(() => {
    const loadStudentAccounts = async () => {
      try {
        const department = content?.studentDepartments?.[0];
        if (!department) {
          setStudentAccounts([]);
          return;
        }
        const response = await fetch(
          `${API_BASE_URL}/student-accounts/?department=${encodeURIComponent(department)}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Unable to load student approvals.");
        }
        const records = await response.json();
        setStudentAccounts(records);
      } catch (error) {
        setApprovalMessage(error.message || "Unable to load student approvals.");
      }
    };

    if (content) {
      loadStudentAccounts();
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
          throw new Error("Unable to load faculty accounts.");
        }

        const records = await response.json();
        setFacultyMembers(records);
      } catch (error) {
        setFacultyLoadError(error.message || "Unable to load faculty accounts.");
      } finally {
        setIsFacultyLoading(false);
      }
    };

    if (content) {
      loadFacultyAccounts();
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
    const placedPercentage = totalStudents
      ? Math.round((placedStudents / totalStudents) * 100)
      : 0;
    const mentorAssigned = students.filter((student) =>
      String(student.mentor || student.mentorName || "").trim()
    ).length;

    return {
      totalStudents,
      eligibleStudents,
      placedStudents,
      averageCgpa,
      placedPercentage,
      mentorAssigned,
    };
  }, [students]);
  const pendingStudentAccounts = studentAccounts.filter(
    (account) => String(account.approval_status || "").toLowerCase() !== "approved"
  );

  const hodRecord = facultyMembers[0];
  const buildHodPage = (section) => `hod:${departmentKey}:${section}`;
  const kpiCards = [
    {
      label: "Total Students",
      value: metrics.totalStudents,
      detail: "Registered under department",
    },
    {
      label: "Eligible Students",
      value: metrics.eligibleStudents,
      detail: "Ready for placement process",
    },
    {
      label: "Placed Students",
      value: metrics.placedStudents,
      detail: "Confirmed placement records",
    },
    {
      label: "Average CGPA",
      value: metrics.averageCgpa,
      detail: "Current academic average",
    },
  ];
  const progressSegments = [
    {
      label: "Placed",
      value: metrics.placedStudents,
      total: metrics.totalStudents,
      tone: "primary",
    },
    {
      label: "Eligible",
      value: metrics.eligibleStudents,
      total: metrics.totalStudents,
      tone: "secondary",
    },
    {
      label: "Mentor Mapping",
      value: metrics.mentorAssigned,
      total: metrics.totalStudents,
      tone: "soft",
    },
  ];

  const renderMainPanel = () => {
    if (isLoading) {
      return (
        <section className="hod-surface-card">
          <h2>Loading HOD dashboard...</h2>
        </section>
      );
    }

    if (loadError) {
      return (
        <section className="hod-surface-card">
          <h2>HOD Dashboard</h2>
          <p className="portal-page-text">{loadError}</p>
        </section>
      );
    }

    if (activeSection === "approvals") {
      return (
        <div className="hod-panel-stack">
          <section className="hod-surface-card">
            <div className="hod-surface-head">
              <div>
                <p className="portal-page-tag">Approval Queue</p>
                <h2>Student Profile Approvals</h2>
                <p className="portal-page-text">
                  Review student login requests submitted by faculty for {content.title}.
                </p>
              </div>
            </div>
          </section>

          <section className="hod-surface-card">
            {approvalMessage ? <p className="portal-page-text">{approvalMessage}</p> : null}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Added By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudentAccounts.length ? (
                    pendingStudentAccounts.map((student) => (
                      <tr key={student.id || student.username}>
                        <td>{student.username}</td>
                        <td>{student.department || "-"}</td>
                        <td>{student.approval_status || "pending"}</td>
                        <td>{student.added_by || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-action-button"
                            disabled={approvingStudentId === student.id}
                            onClick={async () => {
                              try {
                                setApprovingStudentId(student.id);
                                setApprovalMessage("");
                                const response = await fetch(
                                  `${API_BASE_URL}/student-accounts/${student.id}/approve/`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                  }
                                );
                                const data = await response.json();
                                if (!response.ok) {
                                  throw new Error(data.detail || "Unable to approve student.");
                                }
                                setStudentAccounts((current) =>
                                  current.map((item) =>
                                    item.id === student.id ? data : item
                                  )
                                );
                                setApprovalMessage(
                                  `${student.username} approved successfully.`
                                );
                              } catch (error) {
                                setApprovalMessage(
                                  error.message || "Unable to approve student account."
                                );
                              } finally {
                                setApprovingStudentId("");
                              }
                            }}
                          >
                            {approvingStudentId === student.id ? "Approving..." : "Approve"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">No pending student approvals right now.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === "students") {
      return (
        <div className="hod-panel-stack">
          <section className="hod-surface-card">
            <p className="portal-page-tag">Student Records</p>
            <h2>{content.sidebarTitle} Student Details</h2>
          </section>

          <section className="hod-surface-card">
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

    if (activeSection === "faculty") {
      const handleDeleteFaculty = async (facultyId, facultyUsername) => {
        if (!facultyId) {
          setFacultySubmitMessage("Unable to delete this faculty record.");
          return;
        }

        const isConfirmed = window.confirm(
          `Are you sure you want to remove ${facultyUsername}?`
        );
        if (!isConfirmed) {
          return;
        }

        try {
          setDeletingFacultyId(facultyId);
          setFacultySubmitMessage("");
          const response = await fetch(`${API_BASE_URL}/faculty-accounts/${facultyId}/`, {
            method: "DELETE",
            credentials: "include",
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || "Unable to delete faculty account.");
          }

          setFacultyMembers((current) =>
            current.filter((member) => (member.id || member.fac_username) !== facultyId)
          );
          setFacultySubmitMessage("Faculty account removed successfully.");
        } catch (error) {
          setFacultySubmitMessage(error.message || "Unable to delete faculty account.");
        } finally {
          setDeletingFacultyId("");
        }
      };

      return (
        <div className="hod-panel-stack">
          <section className="hod-surface-card">
            <p className="portal-page-tag">Faculty Team</p>
            <h2>{content.sidebarTitle} Faculty Overview</h2>
            <p className="portal-page-text">
              Add faculty details here. The faculty name becomes the username and the
              default password is stored as 1234 for first-time login.
            </p>
          </section>

          <section className="hod-surface-card">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fac-name">Faculty Name</label>
                <input
                  id="fac-name"
                  type="text"
                  value={facultyForm.name}
                  onChange={(event) =>
                    setFacultyForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter faculty name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fac-degree">Degree</label>
                <input
                  id="fac-degree"
                  type="text"
                  value={facultyForm.degree}
                  onChange={(event) =>
                    setFacultyForm((current) => ({
                      ...current,
                      degree: event.target.value,
                    }))
                  }
                  placeholder="Enter degree"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="fac-position">Position</label>
                <input
                  id="fac-position"
                  type="text"
                  value={facultyForm.position}
                  onChange={(event) =>
                    setFacultyForm((current) => ({
                      ...current,
                      position: event.target.value,
                    }))
                  }
                  placeholder="Enter faculty position"
                />
              </div>
            </div>
            <div className="form-navigation">
              <div className="portal-page-text">
                {facultySubmitMessage ||
                  "Faculty name will be stored as username and the default password will be 1234."}
              </div>
              <button
                type="button"
                onClick={async () => {
                  const name = facultyForm.name.trim();
                  const degree = facultyForm.degree.trim();
                  const position = facultyForm.position.trim();
                  const department = content?.studentDepartments?.[0] || "";

                  if (!name || !degree || !position || !department) {
                    setFacultySubmitMessage(
                      "Faculty name, degree, and position are required."
                    );
                    return;
                  }

                  try {
                    setIsSubmittingFaculty(true);
                    setFacultySubmitMessage("");
                    const response = await fetch(`${API_BASE_URL}/faculty-accounts/`, {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        name,
                        degree,
                        position,
                        department,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error("Unable to add faculty account.");
                    }

                    const createdAccount = await response.json();
                    setFacultyMembers((current) => [createdAccount, ...current]);
                    setFacultyForm({ name: "", degree: "", position: "" });
                    setFacultySubmitMessage("Faculty account added successfully.");
                  } catch (error) {
                    setFacultySubmitMessage(
                      error.message || "Unable to add faculty account."
                    );
                  } finally {
                    setIsSubmittingFaculty(false);
                  }
                }}
                disabled={isSubmittingFaculty}
              >
                {isSubmittingFaculty ? "Saving..." : "Add Faculty"}
              </button>
            </div>
          </section>

          <section className="hod-teacher-grid">
            {isFacultyLoading ? (
              <article className="hod-faculty-card">
                <h3>Loading faculty accounts...</h3>
              </article>
            ) : facultyLoadError ? (
              <article className="hod-faculty-card">
                <h3>Unable to load faculty accounts</h3>
                <p>{facultyLoadError}</p>
              </article>
            ) : facultyMembers.length ? (
              facultyMembers.map((member) => (
                <article className="hod-faculty-card" key={member.id || member.fac_username}>
                  <div className="hod-faculty-avatar">
                    {member.fac_username.charAt(0).toUpperCase()}
                  </div>
                  <h3>{member.name || member.fac_username}</h3>
                  <p>{member.position || "Faculty Account"}</p>
                  {member.degree ? (
                    <span className="hod-faculty-meta">{member.degree}</span>
                  ) : null}
                  <button
                    type="button"
                    className="admin-action-button hod-faculty-remove"
                    onClick={() =>
                      handleDeleteFaculty(member.id, member.fac_username)
                    }
                    disabled={deletingFacultyId === member.id}
                  >
                    {deletingFacultyId === member.id ? "Removing..." : "Remove Faculty"}
                  </button>
                </article>
              ))
            ) : (
              <article className="hod-faculty-card">
                <h3>No faculty added yet</h3>
                <p>Add faculty details here and they will appear in this page.</p>
              </article>
            )}
          </section>
        </div>
      );
    }


    if (activeSection === "reports") {
      return (
        <div className="hod-panel-stack">
          <section className="hod-surface-card">
            <p className="portal-page-tag">Reports</p>
            <h2>Department Reports</h2>
            <p className="portal-page-text">
              Export-ready placement summaries and department-level review points for{" "}
              {content.title}.
            </p>
          </section>

          <section className="hod-report-grid">
            <article className="hod-report-card">
              <h3>Placement Snapshot</h3>
              <ul className="admin-list">
                <li>Total Students: {metrics.totalStudents}</li>
                <li>Eligible Students: {metrics.eligibleStudents}</li>
                <li>Placed Students: {metrics.placedStudents}</li>
                <li>Average CGPA: {metrics.averageCgpa}</li>
              </ul>
            </article>
            <article className="hod-report-card">
              <h3>Actionable Follow-up</h3>
              <ul className="admin-list">
                <li>Approval Queue: {pendingStudentAccounts.length}</li>
                <li>Mentor Mapping Completed: {metrics.mentorAssigned}</li>
                <li>Placed Percentage: {metrics.placedPercentage}%</li>
                <li>Faculty Records Listed: {facultyMembers.length}</li>
              </ul>
            </article>
          </section>
        </div>
      );
    }

    return (
      <div className="hod-panel-stack">
        <section className="hod-hero">
          <div className="hod-hero-top">
            <div className="hod-hero-copy">
              <p className="portal-page-tag">HOD Access</p>
              <h1>Welcome, {currentUser?.username || content.sidebarTitle} HOD</h1>
              <p className="hod-hero-text">
                Monitor approvals, faculty engagement, and placement readiness for{" "}
                {content.title} from one clear department workspace.
              </p>
              <div className="hod-hero-badges">
                <span>Placement Oversight</span>
                <span>Faculty Coordination</span>
                <span>Student Review</span>
              </div>
            </div>
            <div className="hod-hero-search">
              <input type="text" placeholder="Search students, faculty, reports..." />
            </div>
          </div>

          <div className="hod-kpi-row">
            {kpiCards.map((card) => (
              <article className="hod-kpi-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="hod-insight-grid">
          <article className="hod-surface-card hod-progress-card">
            <h3>Department Progress</h3>
            <p className="hod-card-copy">
              Visual snapshot of the department pipeline across the current student cohort.
            </p>
            <div className="hod-progress-stack">
              {progressSegments.map((segment) => {
                const percent = segment.total
                  ? Math.round((segment.value / segment.total) * 100)
                  : 0;

                return (
                  <div className="hod-progress-row" key={segment.label}>
                    <div className="hod-progress-row-head">
                      <span>{segment.label}</span>
                      <strong>
                        {segment.value}/{segment.total}
                      </strong>
                    </div>
                    <div className="hod-progress-bar">
                      <div
                        className={`hod-progress-bar-fill hod-progress-bar-fill-${segment.tone}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="hod-progress-row-percent">{percent}%</span>
                  </div>
                );
              })}
            </div>
            <div className="hod-progress-summary">
              <strong>{metrics.placedPercentage}%</strong>
              <span>overall placement conversion</span>
            </div>
          </article>

          <article className="hod-surface-card">
            <h3>Your Team Progress</h3>
            <p className="hod-card-copy">
              Snapshot of the core faculty team and current review momentum.
            </p>
            <div className="hod-team-list">
              {facultyMembers.length ? (
                facultyMembers.slice(0, 3).map((member, index) => {
                  const progress = Math.max(48, 84 - index * 12);
                  return (
                    <div
                      className="hod-team-item"
                      key={member.id || member.fac_username}
                    >
                      <div className="hod-team-avatar">
                        {member.fac_username.charAt(0).toUpperCase()}
                      </div>
                      <div className="hod-team-copy">
                        <strong>{member.fac_username}</strong>
                        <span>Faculty Account</span>
                      </div>
                      <div className="hod-team-meter">
                        <div
                          className="hod-team-meter-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="hod-team-percent">{progress}%</span>
                    </div>
                  );
                })
              ) : (
                <p className="portal-page-text">
                  No faculty accounts added yet. Use the Faculty page to add one.
                </p>
              )}
            </div>
          </article>

          <article className="hod-highlight-card">
            <p>Approval Queue</p>
            <strong>{pendingStudentAccounts.length}</strong>
            <span>student profiles pending review</span>
            <div className="hod-highlight-meta">
              <span>{metrics.eligibleStudents} eligible</span>
              <span>{metrics.placedStudents} placed</span>
            </div>
          </article>

          <aside className="hod-schedule-card">
            <h3>Department Snapshot</h3>
            <div className="hod-schedule-list">
              <div className="hod-schedule-item">
                <span>Average CGPA</span>
                <strong>{metrics.averageCgpa}</strong>
              </div>
              <div className="hod-schedule-item">
                <span>Mentor Mapping</span>
                <strong>{metrics.mentorAssigned}/{metrics.totalStudents}</strong>
              </div>
              <div className="hod-schedule-item">
                <span>Head of Department</span>
                <strong>{hodRecord?.fac_username || "To be updated"}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="hod-teacher-grid">
          {facultyMembers.length ? (
            facultyMembers.slice(0, 3).map((member) => (
              <article
                className="hod-faculty-card"
                key={member.id || member.fac_username}
              >
                <div className="hod-faculty-avatar">
                  {member.fac_username.charAt(0).toUpperCase()}
                </div>
                <span className="hod-faculty-role-tag">
                  {member === hodRecord ? "Latest Faculty" : "Faculty"}
                </span>
                <h3>{member.fac_username}</h3>
                <p>Faculty Account</p>
                <span className="hod-faculty-meta">{member.department}</span>
              </article>
            ))
          ) : (
            <article className="hod-faculty-card">
              <div className="hod-faculty-avatar">F</div>
              <span className="hod-faculty-role-tag">Faculty</span>
              <h3>No faculty accounts yet</h3>
              <p>Add faculty usernames from the Faculty page.</p>
            </article>
          )}
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
      <div className="admin-dashboard-shell hod-dashboard-shell">
        <aside className="admin-sidebar hod-sidebar">
          <div className="admin-sidebar-brand">
            <p className="admin-sidebar-tag">{content?.sidebarTitle || departmentKey.toUpperCase()}</p>
            <h2>HOD Panel</h2>
          </div>

          <nav className="admin-sidebar-nav">
            {hodSections.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar-link ${activeSection === item.key ? "active" : ""}`}
                onClick={() => onNavigate(buildHodPage(item.key))}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button type="button" className="admin-sidebar-profile-trigger">
              <div className="admin-sidebar-avatar">
                {String(currentUser?.username || "H").charAt(0).toUpperCase()}
              </div>
              <div className="admin-sidebar-profile-copy">
                <span className="admin-sidebar-profile-title">
                  {currentUser?.username || "HOD"}
                </span>
                <span className="admin-sidebar-profile-subtitle">Department Head</span>
              </div>
            </button>
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </aside>

        <div className="admin-dashboard-main">{renderMainPanel()}</div>
      </div>
    </PortalLayout>
  );
}

export default HodDashboard;
