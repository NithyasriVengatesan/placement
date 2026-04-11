import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";
import logo from "./logo.jpg";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const studentSections = [
  { key: "dashboard", label: "Dashboard" },
  { key: "intern-job", label: "Intern Job" },
  { key: "profile", label: "Profile" },
];

const TAMIL_NADU_LOCATIONS = [
  "chennai",
  "coimbatore",
  "madurai",
  "trichy",
  "tiruchirappalli",
  "salem",
  "erode",
  "hosur",
  "vellore",
  "tirunelveli",
  "thanjavur",
  "rajapalayam",
  "virudhunagar",
  "tamil nadu",
];

function classifyHiringLocation(locationValue) {
  const normalizedLocation = String(locationValue || "").trim().toLowerCase();

  if (!normalizedLocation) {
    return "India";
  }

  if (TAMIL_NADU_LOCATIONS.some((location) => normalizedLocation.includes(location))) {
    return "Tamil Nadu";
  }

  if (
    normalizedLocation.includes("overseas") ||
    normalizedLocation.includes("international") ||
    normalizedLocation.includes("usa") ||
    normalizedLocation.includes("uk") ||
    normalizedLocation.includes("europe") ||
    normalizedLocation.includes("singapore") ||
    normalizedLocation.includes("dubai") ||
    normalizedLocation.includes("uae") ||
    normalizedLocation.includes("germany") ||
    normalizedLocation.includes("canada") ||
    normalizedLocation.includes("australia")
  ) {
    return "Overseas";
  }

  return "India";
}

function StudentDashboard({
  departmentKey,
  activeSection = "dashboard",
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const content = getDepartmentContent(departmentKey);
  const [studentProfile, setStudentProfile] = useState(null);
  const [internships, setInternships] = useState([]);
  const [hirings, setHirings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const [studentsResponse, internshipResponse, hiringResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/students/`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/portal/internships/`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/portal/hirings/`, { credentials: "include" }),
        ]);

        if (!studentsResponse.ok || !internshipResponse.ok || !hiringResponse.ok) {
          throw new Error("Unable to load the student dashboard.");
        }

        const [studentRecords, internshipRecords, hiringRecords] = await Promise.all([
          studentsResponse.json(),
          internshipResponse.json(),
          hiringResponse.json(),
        ]);

        setStudentProfile(
          studentRecords.find(
            (student) =>
              String(student.regno || "").trim().toUpperCase() ===
              String(currentUser?.username || "").trim().toUpperCase()
          ) || null
        );
        setInternships(internshipRecords);
        setHirings(hiringRecords);
      } catch (error) {
        setLoadError(error.message || "Unable to load the student dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [currentUser]);

  const buildStudentPage = (section) => `student:${departmentKey}:${section}`;
  const metrics = useMemo(
    () => ({
      internships: internships.length,
      jobs: hirings.length,
      cgpa: studentProfile?.cgpa || "0.00",
    }),
    [internships, hirings, studentProfile]
  );

  const categorizedJobs = useMemo(() => {
    const buckets = {
      "Tamil Nadu": [],
      India: [],
      Overseas: [],
    };

    hirings.forEach((hiring) => {
      const bucket = classifyHiringLocation(hiring.location);
      buckets[bucket].push(hiring);
    });

    return buckets;
  }, [hirings]);

  const studentDisplayName = `${studentProfile?.firstName || ""} ${studentProfile?.lastName || ""}`.trim()
    || currentUser?.username
    || "Student";
  const studentAvatarSource =
    studentProfile?.documents?.passportDocument &&
    /\.(png|jpe?g)$/i.test(studentProfile.documents.passportDocument)
      ? studentProfile.documents.passportDocument
      : "";

  const renderPanel = () => {
    if (isLoading) {
      return (
        <section className="student-surface-card">
          <h2>Loading student dashboard...</h2>
        </section>
      );
    }

    if (loadError) {
      return (
        <section className="student-surface-card">
          <h2>Student Dashboard</h2>
          <p className="portal-page-text">{loadError}</p>
        </section>
      );
    }

    if (activeSection === "intern-job") {
      return (
        <div className="student-panel-stack">
          <section className="student-surface-card">
            <p className="portal-page-tag">Opportunities</p>
            <h2>Internships and Jobs</h2>
            <p className="portal-page-text">
              Explore current internship and job opportunities available for {content.title}.
            </p>
          </section>

          <section className="student-opportunity-grid">
            <article className="student-surface-card">
              <h3>Intern Opportunities</h3>
              <div className="student-opportunity-list">
                {internships.map((internship) => (
                  <div className="student-opportunity-card" key={`${internship.name}-${internship.role}`}>
                    <strong>{internship.name}</strong>
                    <span>{internship.role}</span>
                    <small>
                      {internship.mode} | {internship.location} | {internship.duration}
                    </small>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-surface-card student-job-classification-card">
              <h3>Job Opportunities by Location</h3>
              <div className="student-job-bucket-grid">
                {Object.entries(categorizedJobs).map(([bucket, jobs]) => (
                  <div className="student-job-bucket" key={bucket}>
                    <div className="student-job-bucket-head">
                      <strong>{bucket}</strong>
                      <span>{jobs.length}</span>
                    </div>
                    <div className="student-opportunity-list">
                      {jobs.length ? (
                        jobs.map((hiring) => (
                          <div
                            className="student-opportunity-card"
                            key={`${bucket}-${hiring.company}-${hiring.role}`}
                          >
                            <strong>{hiring.company}</strong>
                            <span>{hiring.role}</span>
                            <small>
                              {hiring.package} | {hiring.location} | Deadline {hiring.deadline}
                            </small>
                          </div>
                        ))
                      ) : (
                        <div className="student-opportunity-card student-opportunity-empty">
                          <small>No current openings listed.</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <div className="student-panel-stack">
          <section className="student-surface-card">
            <div className="admin-card-headline">
              <div>
                <p className="portal-page-tag">Student Profile</p>
                <h2>{studentProfile ? "Profile Details" : "Complete Your Profile"}</h2>
                <p className="portal-page-text">
                  Your placement registration details appear here after you submit the student form.
                </p>
              </div>
              <button type="button" onClick={onOpenStudentForm}>
                {studentProfile ? "Update Profile" : "Fill Profile"}
              </button>
            </div>
          </section>

          {studentProfile ? (
            <section className="student-profile-grid">
              <article className="student-profile-card">
                <span>Name</span>
                <strong>{`${studentProfile.firstName || ""} ${studentProfile.lastName || ""}`.trim()}</strong>
              </article>
              <article className="student-profile-card">
                <span>Register Number</span>
                <strong>{studentProfile.regno || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>Department</span>
                <strong>{studentProfile.department || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>Class Advisor</span>
                <strong>{studentProfile.classAdvisor || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>CGPA</span>
                <strong>{studentProfile.cgpa || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>Primary Email</span>
                <strong>{studentProfile.primaryEmail || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>Phone Number</span>
                <strong>{studentProfile.phoneNumber || "-"}</strong>
              </article>
              <article className="student-profile-card">
                <span>Placement Preference</span>
                <strong>{studentProfile.placement || "-"}</strong>
              </article>
            </section>
          ) : (
            <section className="student-surface-card">
              <p className="portal-page-text">
                Your profile is not filled yet. Use the update button to complete the student form.
              </p>
            </section>
          )}
        </div>
      );
    }

    return (
      <div className="student-panel-stack">
        <section className="student-hero-card">
          <div className="student-hero-copy">
            <p className="portal-page-tag">Student Access</p>
            <h1>Welcome, {currentUser?.username || "Student"}</h1>
            <p className="portal-page-text">
              Track your profile readiness and explore internships and job opportunities from one dashboard.
            </p>
          </div>
          <div className="student-kpi-grid">
            <article className="student-kpi-card">
              <span>Internships</span>
              <strong>{metrics.internships}</strong>
            </article>
            <article className="student-kpi-card">
              <span>Jobs</span>
              <strong>{metrics.jobs}</strong>
            </article>
            <article className="student-kpi-card">
              <span>CGPA</span>
              <strong>{metrics.cgpa}</strong>
            </article>
          </div>
        </section>

        <section className="student-opportunity-grid">
          <article className="student-surface-card">
            <h3>Latest Intern Opportunities</h3>
            <div className="student-opportunity-list">
              {internships.slice(0, 3).map((internship) => (
                <div className="student-opportunity-card" key={`${internship.name}-${internship.role}`}>
                  <strong>{internship.name}</strong>
                  <span>{internship.role}</span>
                  <small>{internship.location}</small>
                </div>
              ))}
            </div>
          </article>
          <article className="student-surface-card">
            <h3>Job Classification Snapshot</h3>
            <div className="student-job-summary-grid">
              {Object.entries(categorizedJobs).map(([bucket, jobs]) => (
                <div className="student-job-summary-card" key={bucket}>
                  <span>{bucket}</span>
                  <strong>{jobs.length}</strong>
                  <small>
                    {jobs[0]
                      ? `${jobs[0].company} • ${jobs[0].role}`
                      : "No current openings"}
                  </small>
                </div>
              ))}
            </div>
          </article>
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
      <div className="admin-dashboard-shell student-dashboard-shell">
        <aside className="admin-sidebar student-sidebar">
          <div className="admin-sidebar-brand">
            <p className="admin-sidebar-tag">{content?.sidebarTitle || departmentKey.toUpperCase()}</p>
            <h2>Student Panel</h2>
          </div>

          <nav className="admin-sidebar-nav">
            {studentSections.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar-link ${activeSection === item.key ? "active" : ""}`}
                onClick={() => onNavigate(buildStudentPage(item.key))}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="student-sidebar-user-card">
              <div className="student-sidebar-identity">
                <div className="student-sidebar-profile-visual">
                  {studentAvatarSource ? (
                    <img
                      src={studentAvatarSource}
                      alt={studentDisplayName}
                      className="student-sidebar-photo"
                    />
                  ) : (
                    <div className="admin-sidebar-avatar student-sidebar-photo-fallback">
                      {String(studentDisplayName || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="student-sidebar-user-copy">
                  <span className="admin-sidebar-profile-title">
                    {studentDisplayName}
                  </span>
                  <span className="admin-sidebar-profile-subtitle">
                    {studentProfile?.regno || currentUser?.username || ""}
                  </span>
                </div>
              </div>
              <div className="student-sidebar-brand-card">
                <img
                  src={logo}
                  alt="Ramco Institute of Technology"
                  className="student-sidebar-brand-logo"
                />
                <div className="student-sidebar-brand-copy">
                  <strong>RAMCO</strong>
                  <span>{studentProfile?.department || content.sidebarTitle}</span>
                </div>
              </div>
            </div>
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </aside>

        <div className="admin-dashboard-main">{renderPanel()}</div>
      </div>
    </PortalLayout>
  );
}

export default StudentDashboard;
