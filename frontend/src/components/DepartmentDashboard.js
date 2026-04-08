import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function DepartmentDashboard({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchDepartmentDashboard = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/dashboard/department/overview/`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load department dashboard.");
        }
        setDashboardData(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load department dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentDashboard();
  }, []);

  return (
    <PortalLayout
      currentPage=""
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {isLoading ? (
        <section className="portal-page-card">
          <h1>Loading department dashboard...</h1>
        </section>
      ) : loadError ? (
        <section className="portal-page-card">
          <h1>Department Dashboard</h1>
          <p className="portal-page-text">{loadError}</p>
        </section>
      ) : (
        <>
          <section className="portal-page-card internal-dashboard-card">
            <p className="portal-page-tag">Department Access</p>
            <h1>Department Dashboard</h1>
            <p className="portal-page-text">
              Welcome{currentUser?.username ? `, ${currentUser.username}` : ""}. This
              department area tracks student readiness, eligibility, and placement
              progress using the submitted student form records.
            </p>
          </section>

          <section className="admin-kpi-grid">
            {dashboardData.kpis.map((card) => (
              <article className="dashboard-card" key={card.label}>
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-grid dashboard-grid-two">
            <article className="dashboard-card">
              <h3>Department Breakdown</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total</th>
                      <th>Eligible</th>
                      <th>Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.department_stats.map((item) => (
                      <tr key={item.department}>
                        <td>{item.department}</td>
                        <td>{item.total_students}</td>
                        <td>{item.eligible_students}</td>
                        <td>{item.placed_students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card">
              <h3>Department Follow-up</h3>
              <ul className="portal-bullet-list">
                {dashboardData.follow_up_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="dashboard-card">
            <div className="admin-card-headline">
              <div>
                <h3>CSE Department Page</h3>
                <p>
                  Open the first dedicated department page built from the official
                  Computer Science and Engineering department details.
                </p>
              </div>
              <button type="button" onClick={() => onNavigate("department:cse:overview")}>
                Open CSE Page
              </button>
            </div>
          </section>
        </>
      )}
    </PortalLayout>
  );
}

export default DepartmentDashboard;
