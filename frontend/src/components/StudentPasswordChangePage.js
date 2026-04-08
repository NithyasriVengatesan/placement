import React, { useState } from "react";
import "../App.css";
import Header from "./Header";
import Footer from "./Footer";
import { getDepartmentContent } from "./departmentContent";
import { PortalSubnav } from "./PortalLayout";
import LoginVisualPanel from "./LoginVisualPanel";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function StudentPasswordChangePage({
  onBack,
  onSuccess,
  onNavigate,
  onOpenStudentForm,
  studentUsername = "",
  departmentKey = "",
}) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const departmentContent = getDepartmentContent(departmentKey);

  const renderEyeButton = (shown, onToggle) => (
    <button
      type="button"
      className="password-toggle-button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
    >
      {shown ? (
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
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/student-accounts/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: studentUsername,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to update student password.");
      }

      onSuccess(data);
    } catch (error) {
      setErrorMessage(error.message || "Unable to update student password.");
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
                    {departmentContent.sidebarTitle || departmentKey.toUpperCase()}
                  </p>
                </div>

                <nav className="department-sidebar-nav">
                  <button type="button" className="department-nav-button" onClick={onBack}>
                    Back to Student Login
                  </button>
                  <button type="button" className="department-nav-button active">
                    Change Password
                  </button>
                </nav>
              </aside>
            ) : null}

            <div className="login-card hod-login-card">
              <LoginVisualPanel
                title="Student Setup"
                caption="Change the default student password once before accessing your department portal."
              />

              <div className="login-card-panel">
                <button type="button" className="login-back-link" onClick={onBack}>
                  Back to Student Login
                </button>
                <p className="login-tag">Student First Login</p>
                <h1>Change Password</h1>
                <p className="login-copy">
                  {studentUsername} is signing in for the first time. Enter a new
                  password and confirm it to continue.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                  <label htmlFor="student-new-password">New Password</label>
                  <div className="password-field-wrap">
                    <input
                      id="student-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={form.newPassword}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      required
                    />
                    {renderEyeButton(showNewPassword, () =>
                      setShowNewPassword((current) => !current)
                    )}
                  </div>

                  <label htmlFor="student-confirm-password">Confirm Password</label>
                  <div className="password-field-wrap">
                    <input
                      id="student-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      required
                    />
                    {renderEyeButton(showConfirmPassword, () =>
                      setShowConfirmPassword((current) => !current)
                    )}
                  </div>

                  {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Save New Password"}
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

export default StudentPasswordChangePage;
