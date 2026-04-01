import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function PlacementDetailsPage({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [pageData, setPageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchPlacementDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/portal/placement-details/`);
        if (!response.ok) {
          throw new Error("Failed to load placement details.");
        }
        setPageData(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load placement details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlacementDetails();
  }, []);

  return (
    <PortalLayout
      currentPage="placement-details"
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {isLoading ? (
        <section className="portal-page-card">
          <h1>Loading placement details...</h1>
        </section>
      ) : loadError ? (
        <section className="portal-page-card">
          <h1>Placement Details</h1>
          <p className="portal-page-text">{loadError}</p>
        </section>
      ) : (
        <>
          <section className="portal-page-card">
            <p className="portal-page-tag">Placement Details</p>
            <h1>{pageData.title}</h1>
            <p className="portal-page-text">{pageData.intro}</p>
          </section>

          <section className="dashboard-grid dashboard-grid-two">
            {pageData.sections.map((section) => (
              <article className="dashboard-card" key={section.title}>
                <h3>{section.title}</h3>
                <ul className="portal-bullet-list">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </>
      )}
    </PortalLayout>
  );
}

export default PlacementDetailsPage;
