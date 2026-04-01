import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import campusView from "../assets/mainview.jpg";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function Dashboard({
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
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(`${API_BASE_URL}/dashboard/overview/`);
        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        setLoadError(error.message || "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartMax = useMemo(() => {
    const stats = dashboardData?.department_placement_stats || [];
    const totals = stats.map((item) => item.male + item.female);
    return Math.max(...totals, 1);
  }, [dashboardData]);

  const genderStyle = useMemo(() => {
    const totals = dashboardData?.gender_totals || { male: 0, female: 0, total: 0 };
    const malePercent = totals.total ? Math.round((totals.male / totals.total) * 100) : 0;
    return {
      background: `conic-gradient(#3f448c 0deg ${malePercent * 3.6}deg, #8f9cff ${malePercent * 3.6}deg 360deg)`,
    };
  }, [dashboardData]);

  return (
    <PortalLayout
      currentPage="home"
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {isLoading ? (
        <section className="portal-page-card">
          <h1>Loading dashboard...</h1>
          <p className="portal-page-text">Fetching placement insights from the backend.</p>
        </section>
      ) : loadError ? (
        <section className="portal-page-card">
          <h1>Dashboard unavailable</h1>
          <p className="portal-page-text">{loadError}</p>
        </section>
      ) : (
        <>
          <section className="dashboard-hero-image-card">
            <img
              src={campusView}
              alt="Ramco Institute of Technology main view"
              className="dashboard-hero-image"
            />
          </section>

          <section className="dashboard-analytics-grid">
            <article className="dashboard-analytics-card">
              <div className="dashboard-card-head">
                <div>
                  <h3>All Placement Result</h3>
                  <p>Male and female placements across 9 departments</p>
                </div>
              </div>

              <div className="placement-chart">
                {dashboardData.department_placement_stats.map((item) => {
                  const departmentLabel =
                    item.department === "CSE(AI & ML)" ? "AIML" : item.department;
                  const maleHeight = `${(item.male / chartMax) * 100}%`;
                  const femaleHeight = `${(item.female / chartMax) * 100}%`;

                  return (
                    <div className="placement-chart-item" key={item.department}>
                      <div className="placement-bar-group">
                        <div
                          className="placement-bar placement-bar-male"
                          style={{ height: maleHeight }}
                          title={`Male: ${item.male}`}
                        />
                      <div
                        className="placement-bar placement-bar-female"
                        style={{ height: femaleHeight }}
                        title={`Female: ${item.female}`}
                      />
                    </div>
                      <span className="placement-chart-label">{departmentLabel}</span>
                    </div>
                  );
                })}
              </div>

              <div className="placement-chart-legend">
                <span><i className="legend-dot legend-male" /> Male</span>
                <span><i className="legend-dot legend-female" /> Female</span>
              </div>
            </article>

            <article className="dashboard-analytics-card students-summary-card">
              <div className="dashboard-card-head">
                <div>
                  <h3>Students</h3>
                  <p>Total placed students by gender</p>
                </div>
              </div>

              <div className="students-donut-wrap">
                <div className="students-donut" style={genderStyle}>
                  <div className="students-donut-center">
                    <span>Total</span>
                    <strong>{dashboardData.gender_totals.total}</strong>
                  </div>
                </div>
              </div>

              <div className="students-summary-legend">
                <span><i className="legend-dot legend-male" /> Male {dashboardData.gender_totals.male}</span>
                <span><i className="legend-dot legend-female" /> Female {dashboardData.gender_totals.female}</span>
              </div>
            </article>
          </section>

          <section className="dashboard-table-card">
            <div className="dashboard-card-head">
              <div>
                <h3>Star Students</h3>
                <p>Top performing students fetched from the backend</p>
              </div>
            </div>

            <div className="star-students-table-wrap">
              <table className="star-students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Marks</th>
                    <th>Percent</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.star_students.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.name}</td>
                      <td>{student.student_id}</td>
                      <td>{student.marks}</td>
                      <td>{student.percent}%</td>
                      <td>{student.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PortalLayout>
  );
}

export default Dashboard;
