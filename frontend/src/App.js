import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import PlacementDetailsPage from "./components/PlacementDetailsPage";
import InternsPage from "./components/InternsPage";
import HiringsPage from "./components/HiringsPage";
import ContactPage from "./components/ContactPage";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import DepartmentDashboard from "./components/DepartmentDashboard";
import StudentForm from "./StudentForm";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/status/`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.authenticated) {
          setCurrentUser(data);
          setCurrentPage(data.role === "department" ? "department-dashboard" : "admin-dashboard");
        }
      } catch (error) {
        setCurrentUser(null);
      }
    };

    fetchAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Best effort logout for the local portal.
    } finally {
      setCurrentUser(null);
      setCurrentPage("home");
    }
  };

  if (currentPage === "student-form") {
    return (
      <div>
        <div className="back-bar">
          <button className="back-button" onClick={() => setCurrentPage("home")}>
            Back to Dashboard
          </button>
        </div>
        <StudentForm />
      </div>
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onBack={() => setCurrentPage("home")}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage(user.role === "department" ? "department-dashboard" : "admin-dashboard");
        }}
      />
    );
  }

  if (currentPage === "admin-dashboard") {
    return (
      <AdminDashboard
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "department-dashboard") {
    return (
      <DepartmentDashboard
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "placement-details") {
    return (
      <PlacementDetailsPage
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "interns") {
    return (
      <InternsPage
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "hirings") {
    return (
      <HiringsPage
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "contact") {
    return (
      <ContactPage
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={() => setCurrentPage("login")}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      onNavigate={setCurrentPage}
      onOpenStudentForm={() => setCurrentPage("student-form")}
      onOpenLogin={() => setCurrentPage("login")}
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}

export default App;
