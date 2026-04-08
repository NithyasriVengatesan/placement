import React, { useState } from "react";
import "../App.css";
import Header from "./Header";
import Footer from "./Footer";
import { getDepartmentContent } from "./departmentContent";
import { PortalSubnav } from "./PortalLayout";
import LoginVisualPanel from "./LoginVisualPanel";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function HodLoginPage({
  onBack,
  onLoginSuccess,
  onNavigate,
  onOpenStudentForm,
  initialDepartmentKey = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const departmentContent = getDepartmentContent(initialDepartmentKey);

  const handleChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          loginType: "hod",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "HOD login failed.");
      }

      onLoginSuccess(data);
    } catch (error) {
      setErrorMessage(error.message || "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-wrapper">
      <Header onOpenLogin={() => {}} />
      <PortalSubnav
        currentPage=""
        onNavigate={onNavigate}
        onOpenStudentForm={onOpenStudentForm}
      />
      <main className="main-content">
        <div className="container">
          <div className="login-page-shell hod-login-shell">
            {departmentContent ? (
              <aside className="department-sidebar">
                <div className="department-sidebar-card department-sidebar-card-compact">
                  <p className="department-sidebar-title">
                    {departmentContent.sidebarTitle || initialDepartmentKey.toUpperCase()}
                  </p>
                </div>

                <nav className="department-sidebar-nav">
                  <button type="button" className="department-nav-button" onClick={onBack}>
                    Back to Department
                  </button>
                  <button type="button" className="department-nav-button active">
                    HOD Login
                  </button>
                </nav>
              </aside>
            ) : null}

            <div className="login-card hod-login-card">
              <LoginVisualPanel
                title="HOD Access"
                caption="Sign in to review approvals, faculty records, and department placement progress."
              />

              <div className="login-card-panel">
                <button type="button" className="login-back-link" onClick={onBack}>
                  Back to Department
                </button>
                <p className="login-tag">Department Access</p>
                <h1>HOD Login</h1>
                <p className="login-copy">
                  Sign in using your HOD email address and password to access the
                  department placement dashboard.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                  <label htmlFor="hod-login-username">Username or Email</label>
                  <input
                    id="hod-login-username"
                    type="text"
                    value={credentials.username}
                    onChange={(event) => handleChange("username", event.target.value)}
                    required
                  />

                  <label htmlFor="hod-login-password">Password</label>
                  <div className="password-field-wrap">
                    <input
                      id="hod-login-password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(event) => handleChange("password", event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 4.5 19.5 21" />
                          <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                          <path d="M9.4 5.3A11.3 11.3 0 0 1 12 5c5.4 0 9.7 4.5 10.8 7-0.5 1-1.5 2.4-2.9 3.7" />
                          <path d="M6.6 6.7C4.3 8.1 2.8 10 2 12c1.1 2.5 5.4 7 10 7 1.6 0 3.1-.3 4.4-.9" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="login-options-row">
                    <label className="login-remember">
                      <input type="checkbox" />
                      Remember me
                    </label>
                    <span className="login-forgot">Forgot password?</span>
                  </div>

                  {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Login as HOD"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HodLoginPage;
