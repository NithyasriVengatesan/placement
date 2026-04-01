import React from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

function InternalDashboard({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const dashboardTitle =
    currentUser?.role === "department" ? "Department Dashboard" : "Admin Dashboard";

  return (
    <PortalLayout
      currentPage=""
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <section className="portal-page-card internal-dashboard-card">
        <p className="portal-page-tag">Authenticated Access</p>
        <h1>{dashboardTitle}</h1>
        <p className="portal-page-text">
          Welcome{currentUser?.username ? `, ${currentUser.username}` : ""}. This is
          your internal dashboard area after login. We can continue building the
          admin and department-specific sections from here without disturbing the
          public portal home page.
        </p>

        <div className="internal-dashboard-grid">
          <article className="dashboard-card">
            <h3>Student Management</h3>
            <p>Review student records, submissions, and placement readiness data.</p>
          </article>

          <article className="dashboard-card">
            <h3>Drive Monitoring</h3>
            <p>Track current company drives, deadlines, and hiring progress.</p>
          </article>

          <article className="dashboard-card">
            <h3>Reports & Analytics</h3>
            <p>Access placement summaries and department-wise performance insights.</p>
          </article>
        </div>
      </section>
    </PortalLayout>
  );
}

export default InternalDashboard;
