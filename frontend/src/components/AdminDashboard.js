import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projections", label: "Projections" },
  { key: "students", label: "Student Details" },
  { key: "database", label: "All Data" },
];

const databaseSections = [
  { key: "students", label: "Students", endpoint: "/students/" },
  { key: "facultyAccounts", label: "Faculty Accounts", endpoint: "/faculty-accounts/" },
  { key: "studentAccounts", label: "Student Accounts", endpoint: "/student-accounts/" },
  { key: "starStudents", label: "Star Students", endpoint: "/dashboard/star-students/" },
  { key: "departmentPlacement", label: "Department Placement", endpoint: "/dashboard/department-placement/" },
  { key: "internships", label: "Internships", endpoint: "/portal/internships/" },
  { key: "hirings", label: "Hirings", endpoint: "/portal/hirings/" },
  { key: "contact", label: "Contact", endpoint: "/portal/contact/" },
];

function AdminDashboard({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [databaseData, setDatabaseData] = useState(null);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [databaseLoadError, setDatabaseLoadError] = useState("");

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/dashboard/admin/overview/`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load admin dashboard.");
        }
        setDashboardData(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load admin dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  useEffect(() => {
    if (activeSection !== "database") {
      return;
    }

    const fetchDatabaseData = async () => {
      try {
        setIsDatabaseLoading(true);
        setDatabaseLoadError("");

        const settledResponses = await Promise.allSettled(
          databaseSections.map(async (section) => {
            const response = await fetch(`${API_BASE_URL}${section.endpoint}`, {
              credentials: "include",
            });
            if (!response.ok) {
              throw new Error(`Unable to load ${section.label.toLowerCase()}.`);
            }

            return {
              key: section.key,
              label: section.label,
              data: await response.json(),
            };
          })
        );

        const nextDatabaseData = {};
        const errors = [];

        settledResponses.forEach((result, index) => {
          const section = databaseSections[index];
          if (result.status === "fulfilled") {
            nextDatabaseData[section.key] = result.value.data;
            return;
          }

          nextDatabaseData[section.key] = [];
          errors.push(result.reason?.message || `Unable to load ${section.label.toLowerCase()}.`);
        });

        setDatabaseData(nextDatabaseData);
        if (errors.length) {
          setDatabaseLoadError(errors.join(" "));
        }
      } catch (error) {
        setDatabaseLoadError(error.message || "Unable to load database records.");
      } finally {
        setIsDatabaseLoading(false);
      }
    };

    fetchDatabaseData();
  }, [activeSection]);

  const currentPanel = useMemo(() => {
    if (activeSection === "database") {
      const students = databaseData?.students || [];
      const facultyAccounts = databaseData?.facultyAccounts || [];
      const studentAccounts = databaseData?.studentAccounts || [];
      const starStudents = databaseData?.starStudents || [];
      const departmentPlacement = databaseData?.departmentPlacement || [];
      const internships = databaseData?.internships || [];
      const hirings = databaseData?.hirings || [];
      const contact = databaseData?.contact || {};

      return (
        <div className="admin-panel-stack">
          <section className="admin-page-card">
            <p className="portal-page-tag">All Data</p>
            <h2>Database Records</h2>
            <p className="portal-page-text">
              View the main placement records stored by the application from one place.
            </p>
            {databaseLoadError ? (
              <p className="portal-page-text">{databaseLoadError}</p>
            ) : null}
          </section>

          {isDatabaseLoading ? (
            <section className="admin-page-card">
              <h3>Loading database records...</h3>
            </section>
          ) : (
            <>
              <section className="admin-kpi-grid">
                <article className="admin-kpi-card">
                  <span>Students</span>
                  <strong>{students.length}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>Faculty Accounts</span>
                  <strong>{facultyAccounts.length}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>Student Accounts</span>
                  <strong>{studentAccounts.length}</strong>
                </article>
                <article className="admin-kpi-card">
                  <span>Hirings</span>
                  <strong>{hirings.length}</strong>
                </article>
              </section>

              <section className="admin-page-card">
                <div className="admin-card-headline">
                  <div>
                    <h3>Students</h3>
                    <p>Placement form submissions saved in the student collection.</p>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Register No</th>
                        <th>Department</th>
                        <th>Class Advisor</th>
                        <th>Mentor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length ? (
                        students.map((student) => (
                          <tr key={student.id || student.regno}>
                            <td>{`${student.firstName || ""} ${student.lastName || ""}`.trim() || "-"}</td>
                            <td>{student.regno || "-"}</td>
                            <td>{student.department || "-"}</td>
                            <td>{student.classAdvisor || "-"}</td>
                            <td>{student.mentor || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No student records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-page-card">
                <div className="admin-card-headline">
                  <div>
                    <h3>Faculty Accounts</h3>
                    <p>Faculty and mentor accounts currently stored for departments.</p>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Roles</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyAccounts.length ? (
                        facultyAccounts.map((account) => (
                          <tr key={account.id || account.fac_username || account.employeeId}>
                            <td>{account.name || "-"}</td>
                            <td>{account.employeeId || account.fac_username || "-"}</td>
                            <td>{account.department || "-"}</td>
                            <td>{(account.roles || []).join(", ") || "-"}</td>
                            <td>{account.position || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No faculty account records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-page-card">
                <div className="admin-card-headline">
                  <div>
                    <h3>Student Accounts</h3>
                    <p>Generated student login accounts and their live onboarding status.</p>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Register No</th>
                        <th>Department</th>
                        <th>First Login</th>
                        <th>Profile Completion</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentAccounts.length ? (
                        studentAccounts.map((account) => (
                          <tr key={account.id || account.username}>
                            <td>{account.username || account.regno || "-"}</td>
                            <td>{account.department || "-"}</td>
                            <td>{account.must_change_password ? "Pending" : "Completed"}</td>
                            <td>{typeof account.profileCompletion === "number" ? `${account.profileCompletion}%` : "-"}</td>
                            <td>{account.created_at || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No student account records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="dashboard-grid dashboard-grid-two">
                <article className="dashboard-card">
                  <h3>Star Students</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Student ID</th>
                          <th>Percent</th>
                          <th>Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {starStudents.length ? (
                          starStudents.map((student) => (
                            <tr key={student.id || student.student_id}>
                              <td>{student.name || "-"}</td>
                              <td>{student.student_id || "-"}</td>
                              <td>{student.percent || "-"}</td>
                              <td>{student.year || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">No star student records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="dashboard-card">
                  <h3>Department Placement Stats</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Male</th>
                          <th>Female</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentPlacement.length ? (
                          departmentPlacement.map((record) => (
                            <tr key={record.id || record.department}>
                              <td>{record.department || "-"}</td>
                              <td>{record.male ?? "-"}</td>
                              <td>{record.female ?? "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3">No department placement records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>

              <section className="dashboard-grid dashboard-grid-two">
                <article className="dashboard-card">
                  <h3>Internships</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internships.length ? (
                          internships.map((item, index) => (
                            <tr key={item.id || `${item.company}-${index}`}>
                              <td>{item.company || item.name || "-"}</td>
                              <td>{item.role || "-"}</td>
                              <td>{item.duration || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3">No internship records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="dashboard-card">
                  <h3>Hirings</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hirings.length ? (
                          hirings.map((item, index) => (
                            <tr key={item.id || `${item.company}-${index}`}>
                              <td>{item.company || item.name || "-"}</td>
                              <td>{item.role || item.title || "-"}</td>
                              <td>{item.status || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3">No hiring records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>

              <section className="admin-page-card">
                <div className="admin-card-headline">
                  <div>
                    <h3>Contact Details</h3>
                    <p>Placement portal contact information currently stored.</p>
                  </div>
                </div>
                <div className="admin-profile-grid">
                  {Object.keys(contact).length ? (
                    Object.entries(contact).map(([key, value]) => (
                      <article className="admin-soft-card" key={key}>
                        <span className="admin-profile-label">{key}</span>
                        <strong>{Array.isArray(value) ? value.join(", ") : String(value || "-")}</strong>
                      </article>
                    ))
                  ) : (
                    <article className="admin-soft-card">
                      <strong>No contact data found.</strong>
                    </article>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <section className="admin-page-card">
          <p className="portal-page-tag">Profile</p>
          <h2>Admin Profile</h2>
          <p className="portal-page-text">
            Manage account details, role visibility, and administrative preferences.
          </p>

          <div className="admin-profile-grid">
            <article className="admin-soft-card">
              <span className="admin-profile-label">Username</span>
              <strong>{currentUser?.username || "Admin User"}</strong>
            </article>
            <article className="admin-soft-card">
              <span className="admin-profile-label">Role</span>
              <strong>Admin</strong>
            </article>
            <article className="admin-soft-card">
              <span className="admin-profile-label">Access</span>
              <strong>Portal Management</strong>
            </article>
          </div>
        </section>
      );
    }

    if (isLoading) {
      return (
        <section className="admin-page-card">
          <h2>Loading admin dashboard...</h2>
        </section>
      );
    }

    if (loadError || !dashboardData) {
      return (
        <section className="admin-page-card">
          <h2>Admin Dashboard</h2>
          <p className="portal-page-text">{loadError || "Dashboard data is unavailable."}</p>
        </section>
      );
    }

    if (activeSection === "projections") {
      return (
        <div className="admin-panel-stack">
          <section className="admin-page-card">
            <p className="portal-page-tag">Projections</p>
            <h2>Analytics, Reports & Forecasting</h2>
            <p className="portal-page-text">
              This section is designed for admin forecasting, exportable reports, and
              placement trend monitoring.
            </p>
          </section>

          <section className="admin-projection-grid">
            {dashboardData.projections.map((card) => (
              <article className="admin-soft-card" key={card.title}>
                <h3>{card.title}</h3>
                <ul className="admin-list">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="admin-page-card">
            <div className="admin-card-headline">
              <div>
                <h3>Announcements</h3>
                <p>Latest placement cell updates delivered from the backend.</p>
              </div>
            </div>
            <ul className="admin-list">
              {dashboardData.announcements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      );
    }

    if (activeSection === "students") {
      return (
        <div className="admin-panel-stack">
          <section className="admin-page-card">
            <p className="portal-page-tag">Student Details</p>
            <h2>Student Management</h2>
            <p className="portal-page-text">
              Review student eligibility, placement status, academic readiness, and
              company application stages from one place.
            </p>
          </section>

          <section className="admin-page-card">
            <div className="admin-card-headline">
              <div>
                <h3>Students Overview</h3>
                <p>Use this area later for filters, approvals, and updates.</p>
              </div>
              <button type="button">Add Student</button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Register No</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Eligibility</th>
                    <th>Status</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.students.map((row) => (
                    <tr key={row.regno}>
                      <td>{row.name}</td>
                      <td>{row.regno}</td>
                      <td>{row.department}</td>
                      <td>{row.cgpa}</td>
                      <td>{row.eligibility}</td>
                      <td>{row.status}</td>
                      <td>{row.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="admin-panel-stack">
        <section className="admin-page-card">
          <div className="admin-hero-head">
            <div>
              <p className="portal-page-tag">Admin Access</p>
              <h1>Admin Dashboard</h1>
              <p className="portal-page-text">
                Welcome{currentUser?.username ? `, ${currentUser.username}` : ""}. Get
                a quick view of placements, active drives, and administrative tasks in
                one place.
              </p>
            </div>
            <div className="admin-quick-actions">
              {dashboardData.quick_actions.map((action) => (
                <button type="button" key={action}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-kpi-grid">
          {dashboardData.kpis.map((card) => (
            <article className="admin-kpi-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="admin-management-grid">
          {dashboardData.management_sections.map((section) => (
            <article className="admin-soft-card" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <ul className="admin-list">
                {section.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="dashboard-grid dashboard-grid-two">
          <article className="dashboard-card">
            <h3>Active Drives</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.drives.map((drive) => (
                    <tr key={`${drive.company}-${drive.role}`}>
                      <td>{drive.company}</td>
                      <td>{drive.role}</td>
                      <td>{drive.deadline}</td>
                      <td>{drive.status}</td>
                      <td>{drive.applicants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <h3>Recent Applications</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.applications.map((application) => (
                    <tr key={`${application.student_regno}-${application.company}`}>
                      <td>{application.student_name}</td>
                      <td>{application.company}</td>
                      <td>{application.status}</td>
                      <td>{application.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    );
  }, [
    activeSection,
    currentUser,
    dashboardData,
    isLoading,
    loadError,
    databaseData,
    isDatabaseLoading,
    databaseLoadError,
  ]);

  return (
    <PortalLayout
      currentPage=""
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
      hideHeaderAuth
      contentClassName="container-wide"
    >
      <div className="admin-dashboard-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-tag">Placement Cell</span>
            <h2>Admin Panel</h2>
          </div>

          <nav className="admin-sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar-link ${
                  activeSection === item.key ? "active" : ""
                }`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button
              type="button"
              className={`admin-sidebar-link admin-sidebar-profile-trigger ${
                activeSection === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveSection("profile")}
            >
              <div className="admin-sidebar-avatar">A</div>
              <div className="admin-sidebar-profile-copy">
                <span className="admin-sidebar-profile-title">
                  {currentUser?.username || "Admin User"}
                </span>
                <span className="admin-sidebar-profile-subtitle">Admin Profile</span>
              </div>
            </button>

            <button
              type="button"
              className="admin-sidebar-logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="admin-dashboard-main">{currentPanel}</section>
      </div>
    </PortalLayout>
  );
}

export default AdminDashboard;
