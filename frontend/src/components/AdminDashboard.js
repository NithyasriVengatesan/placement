import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projections", label: "Projections" },
  { key: "students", label: "Student Details" },
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

  const currentPanel = useMemo(() => {
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
  }, [activeSection, currentUser, dashboardData, isLoading, loadError]);

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
