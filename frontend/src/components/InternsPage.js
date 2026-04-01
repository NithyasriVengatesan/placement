import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function InternsPage({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [internshipCompanies, setInternshipCompanies] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/portal/internships/`);
        if (!response.ok) {
          throw new Error("Failed to load internship opportunities.");
        }
        const data = await response.json();
        setInternshipCompanies(data);
        if (data.length > 0) {
          setSelectedInternship(data[0].name);
        }
      } catch (error) {
        setLoadError(error.message || "Unable to load internship opportunities.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, []);

  const selectedInternshipDetails = internshipCompanies.find(
    (company) => company.name === selectedInternship
  );

  return (
    <PortalLayout
      currentPage="interns"
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <section className="portal-page-card">
        <p className="portal-page-tag">Intern Opportunities</p>
        <h1>Intern Opportunities</h1>
        <p className="portal-page-text">
          Choose a company from the list below to view the available internship
          details.
        </p>

        {isLoading ? (
          <p className="portal-page-text">Loading internship opportunities...</p>
        ) : loadError ? (
          <p className="portal-page-text">{loadError}</p>
        ) : (
          <>
            <div className="intern-select-wrap">
              <label htmlFor="intern-company-select">Company Name</label>
              <select
                id="intern-company-select"
                value={selectedInternship}
                onChange={(event) => setSelectedInternship(event.target.value)}
              >
                {internshipCompanies.map((company) => (
                  <option key={company.name} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedInternshipDetails ? (
              <div className="intern-details-panel">
                <div className="intern-details-grid">
                  <div>
                    <span className="intern-details-label">Role</span>
                    <strong>{selectedInternshipDetails.role}</strong>
                  </div>
                  <div>
                    <span className="intern-details-label">Mode</span>
                    <strong>{selectedInternshipDetails.mode}</strong>
                  </div>
                  <div>
                    <span className="intern-details-label">Location</span>
                    <strong>{selectedInternshipDetails.location}</strong>
                  </div>
                  <div>
                    <span className="intern-details-label">Duration</span>
                    <strong>{selectedInternshipDetails.duration}</strong>
                  </div>
                  <div>
                    <span className="intern-details-label">Stipend</span>
                    <strong>{selectedInternshipDetails.stipend}</strong>
                  </div>
                </div>
                <p className="intern-details-summary">
                  {selectedInternshipDetails.summary}
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>
    </PortalLayout>
  );
}

export default InternsPage;
