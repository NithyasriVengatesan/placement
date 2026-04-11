import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const hodSections = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assign-mentor", label: "Faculty Roles" },
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
  const [facultySubmitMessage, setFacultySubmitMessage] = useState("");
  const [deletingFacultyId, setDeletingFacultyId] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [updatingStudentRegno, setUpdatingStudentRegno] = useState("");

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
          throw new Error("Unable to load student accounts.");
        }
        const records = await response.json();
        setStudentAccounts(records);
      } catch (error) {
        setAssignmentMessage(error.message || "Unable to load student accounts.");
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

    if (activeSection === "assign-mentor") {
      return (
        <div className="hod-panel-stack">
          <section className="hod-surface-card">
            <div className="hod-surface-head">
              <div>
                <p className="portal-page-tag">Faculty Access</p>
                <h2>Assign Faculty Roles</h2>
                <p className="portal-page-text">
                  Configure role access for faculty members in this department. Once a role
                  is assigned here, it will appear in the faculty switch-user menu after
                  login.
                </p>
              </div>
            </div>
          </section>

          <section className="hod-surface-card">
            {assignmentMessage ? <p className="portal-page-text">{assignmentMessage}</p> : null}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>HOD</th>
                    <th>Mentor</th>
                    <th>Class Advisor</th>
                    <th>Coordinator</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyMembers.length ? (
                    facultyMembers.map((member) => {
                      const roles = new Set((member.roles || []).map((role) => String(role).trim().toLowerCase()));
                      const requiresClassAssignment =
                        roles.has("mentor") || roles.has("class_advisor");
                      const roleCheckbox = (roleKey) => (
                        <input
                          type="checkbox"
                          checked={roles.has(roleKey)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setFacultyMembers((current) =>
                              current.map((item) => {
                                if ((item.id || item.fac_username) !== (member.id || member.fac_username)) {
                                  return item;
                                }

                                const nextRoles = new Set(
                                  (item.roles || []).map((role) => String(role).trim().toLowerCase())
                                );
                                if (checked) {
                                  nextRoles.add(roleKey);
                                } else {
                                  nextRoles.delete(roleKey);
                                }

                                nextRoles.add("faculty");
                                const nextRequiresClassAssignment =
                                  nextRoles.has("mentor") || nextRoles.has("class_advisor");

                                return {
                                  ...item,
                                  roles: Array.from(nextRoles),
                                  mentor:
                                    roleKey === "mentor"
                                      ? checked
                                      : Array.from(nextRoles).includes("mentor"),
                                  className: nextRequiresClassAssignment
                                    ? item.className || ""
                                    : "",
                                  section: nextRequiresClassAssignment
                                    ? item.section || ""
                                    : "",
                                };
                              })
                            );
                          }}
                        />
                      );

                      return (
                      <tr key={member.id || member.fac_username}>
                        <td>
                          <div>
                            <strong>{member.name || member.fac_username || "-"}</strong>
                            <div>{member.employeeId || member.fac_username || "-"}</div>
                          </div>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={Boolean(member.isHod)}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setFacultyMembers((current) =>
                                current.map((item) =>
                                  (item.id || item.fac_username) === (member.id || member.fac_username)
                                    ? { ...item, isHod: checked }
                                    : item
                                )
                              );
                            }}
                          />
                        </td>
                        <td>{roleCheckbox("mentor")}</td>
                        <td>{roleCheckbox("class_advisor")}</td>
                        <td>{roleCheckbox("coordinator")}</td>
                        <td>
                          {requiresClassAssignment ? (
                            <input
                              type="text"
                              value={member.className || ""}
                              placeholder="Handled class"
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setFacultyMembers((current) =>
                                  current.map((item) =>
                                    (item.id || item.fac_username) === (member.id || member.fac_username)
                                      ? { ...item, className: nextValue }
                                      : item
                                  )
                                );
                              }}
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          {requiresClassAssignment ? (
                            <input
                              type="text"
                              value={member.section || ""}
                              placeholder="Section"
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setFacultyMembers((current) =>
                                  current.map((item) =>
                                    (item.id || item.fac_username) === (member.id || member.fac_username)
                                      ? { ...item, section: nextValue }
                                      : item
                                  )
                                );
                              }}
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-action-button"
                            disabled={updatingStudentRegno === (member.id || member.fac_username)}
                            onClick={async () => {
                              try {
                                const memberKey = member.id || member.fac_username;
                                setUpdatingStudentRegno(memberKey);
                                setAssignmentMessage("");
                                const currentMember = facultyMembers.find(
                                  (item) => (item.id || item.fac_username) === memberKey
                                ) || member;
                                const response = await fetch(
                                  `${API_BASE_URL}/faculty-accounts/roles/`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      username:
                                        currentMember.employeeId ||
                                        currentMember.fac_username ||
                                        "",
                                      isHod: Boolean(currentMember.isHod),
                                      roles: currentMember.roles || ["faculty"],
                                      className: currentMember.className || "",
                                      section: currentMember.section || "",
                                    }),
                                  }
                                );
                                const data = await response.json();
                                if (!response.ok) {
                                  throw new Error(data.detail || "Unable to update faculty roles.");
                                }
                                setFacultyMembers((current) =>
                                  current.map((item) =>
                                    (item.id || item.fac_username) === memberKey
                                      ? data
                                      : item
                                  )
                                );
                                setAssignmentMessage(
                                  `Updated roles for ${data.name || data.fac_username || "faculty member"}.`
                                );
                              } catch (error) {
                                setAssignmentMessage(
                                  error.message || "Unable to update faculty roles."
                                );
                              } finally {
                                setUpdatingStudentRegno("");
                              }
                            }}
                          >
                            {updatingStudentRegno === (member.id || member.fac_username) ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8">No faculty records are available for role assignment yet.</td>
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
            <div className="admin-card-headline">
              <div>
                <p className="portal-page-tag">Student Accounts</p>
                <h3>Student Login Records</h3>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Department</th>
                    <th>Added By</th>
                    <th>First Login</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAccounts.length ? (
                    studentAccounts.map((student) => (
                      <tr key={student.id || student.username}>
                        <td>{student.username}</td>
                        <td>{student.department || "-"}</td>
                        <td>{student.added_by || "-"}</td>
                        <td>{student.must_change_password ? "Pending" : "Completed"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No student login records right now.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="hod-surface-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Register No</th>
                    <th>Class Advisor</th>
                    <th>Mentor</th>
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
                      <td>{student.classAdvisorName || student.classAdvisor || "-"}</td>
                      <td>{student.mentorName || student.mentor || "-"}</td>
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
      const handleDeleteFaculty = async (facultyId, facultyName) => {
        if (!facultyId) {
          setFacultySubmitMessage("Unable to delete this faculty record.");
          return;
        }

        const isConfirmed = window.confirm(
          `Are you sure you want to remove ${facultyName || "this faculty member"}?`
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
              Faculty records here are live department records. Employee ID is the username,
              the faculty name appears in the sidebar profile after login, and the default
              password for first login is 1234.
            </p>
            {facultySubmitMessage ? (
              <p className="portal-page-text">{facultySubmitMessage}</p>
            ) : null}
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
                  <button
                    type="button"
                    className="hod-faculty-remove-button"
                    onClick={() =>
                      handleDeleteFaculty(
                        member.id,
                        member.name || member.fac_username || "this faculty member"
                      )
                    }
                    disabled={deletingFacultyId === member.id}
                  >
                    {deletingFacultyId === member.id ? "Removing..." : "Remove"}
                  </button>
                  <div className="hod-faculty-avatar">
                    {member.fac_username.charAt(0).toUpperCase()}
                  </div>
                  <h3>{member.name || member.fac_username}</h3>
                  <p>{member.position || "Faculty Account"}</p>
                  <div className="hod-faculty-badges">
                    <span>{member.department || "-"}</span>
                    <span>{member.mentor ? "Mentor" : "Faculty"}</span>
                    {member.isHod ? <span>HOD</span> : null}
                  </div>
                  <span className="hod-faculty-meta">
                    {member.employeeId || member.fac_username || "Employee ID not set"}
                  </span>
                  {member.degree ? (
                    <span className="hod-faculty-meta">{member.degree}</span>
                  ) : null}
                  {member.className || member.section ? (
                    <div className="hod-faculty-assignment">
                      <strong>Class Assignment</strong>
                      <span>
                        {[member.className, member.section].filter(Boolean).join(" - ") || "-"}
                      </span>
                    </div>
                  ) : null}
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
                <li>Mentor Mapping Completed: {metrics.mentorAssigned}</li>
                <li>Student Accounts Created: {studentAccounts.length}</li>
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
                Monitor student assignments, faculty engagement, and placement readiness for{" "}
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
            <p>Student Accounts</p>
            <strong>{studentAccounts.length}</strong>
            <span>login records created for students</span>
            <div className="hod-highlight-meta">
              <span>{metrics.mentorAssigned} mapped</span>
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
