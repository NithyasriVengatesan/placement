import React, { useState } from "react";
import "../App.css";
import Header from "./Header";
import Footer from "./Footer";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function LoginPage({ onBack, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    loginType: "admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
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
      <main className="main-content">
        <div className="container">
          <div className="login-page-shell">
            <div className="login-card">
              <button type="button" className="login-back-link" onClick={onBack}>
                Back to Portal
              </button>
              <p className="login-tag">Placement Portal Access</p>
              <h1>Login</h1>
              <p className="login-copy">
                Choose one of the two portal access types and sign in using your
                existing Django credentials.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-type-toggle">
                  <button
                    type="button"
                    className={`login-type-button ${
                      credentials.loginType === "admin" ? "active" : ""
                    }`}
                    onClick={() => handleChange("loginType", "admin")}
                  >
                    Admin Login
                  </button>
                  <button
                    type="button"
                    className={`login-type-button ${
                      credentials.loginType === "department" ? "active" : ""
                    }`}
                    onClick={() => handleChange("loginType", "department")}
                  >
                    Department Login
                  </button>
                </div>

                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  type="text"
                  value={credentials.username}
                  onChange={(event) => handleChange("username", event.target.value)}
                  required
                />

                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={credentials.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  required
                />

                {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Signing in..."
                    : credentials.loginType === "admin"
                      ? "Login as Admin"
                      : "Login as Department"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;
