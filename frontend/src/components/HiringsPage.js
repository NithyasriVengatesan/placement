import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function HiringsPage({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [hirings, setHirings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchHirings = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/portal/hirings/`);
        if (!response.ok) {
          throw new Error("Failed to load hiring updates.");
        }
        setHirings(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load hiring updates.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHirings();
  }, []);

  return (
    <PortalLayout
      currentPage="hirings"
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <section className="portal-page-card">
        <p className="portal-page-tag">Hirings</p>
        <h1>Current Hirings</h1>
        <p className="portal-page-text">
          Browse current hiring opportunities published through the placement cell.
        </p>
      </section>

      {isLoading ? (
        <section className="portal-page-card">
          <p className="portal-page-text">Loading hiring opportunities...</p>
        </section>
      ) : loadError ? (
        <section className="portal-page-card">
          <p className="portal-page-text">{loadError}</p>
        </section>
      ) : (
        <section className="dashboard-grid dashboard-grid-two">
          {hirings.map((hiring) => (
            <article className="dashboard-card" key={`${hiring.company}-${hiring.role}`}>
              <h3>{hiring.company}</h3>
              <div className="intern-details-grid">
                <div>
                  <span className="intern-details-label">Role</span>
                  <strong>{hiring.role}</strong>
                </div>
                <div>
                  <span className="intern-details-label">Package</span>
                  <strong>{hiring.package}</strong>
                </div>
                <div>
                  <span className="intern-details-label">Location</span>
                  <strong>{hiring.location}</strong>
                </div>
                <div>
                  <span className="intern-details-label">Mode</span>
                  <strong>{hiring.mode}</strong>
                </div>
                <div>
                  <span className="intern-details-label">Deadline</span>
                  <strong>{hiring.deadline}</strong>
                </div>
              </div>
              <p className="intern-details-summary">
                Eligible Departments: {hiring.departments.join(", ")}
              </p>
            </article>
          ))}
        </section>
      )}
    </PortalLayout>
  );
}

export default HiringsPage;
