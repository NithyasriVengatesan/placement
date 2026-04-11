import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import PlacementDetailsPage from "./components/PlacementDetailsPage";
import InternsPage from "./components/InternsPage";
import HiringsPage from "./components/HiringsPage";
import ContactPage from "./components/ContactPage";
import LoginPage from "./components/LoginPage";
import HodLoginPage from "./components/HodLoginPage";
import FacultyPasswordChangePage from "./components/FacultyPasswordChangePage";
import StudentPasswordChangePage from "./components/StudentPasswordChangePage";
import AdminDashboard from "./components/AdminDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import HodDashboard from "./components/HodDashboard";
import StudentDashboard from "./components/StudentDashboard";
import DepartmentDashboard from "./components/DepartmentDashboard";
import DepartmentPage from "./components/DepartmentPage";
import PortalLayout from "./components/PortalLayout";
import {
  getDepartmentContent,
  departmentContent,
  getDepartmentKeyFromUsername,
} from "./components/departmentContent";
import StudentForm from "./StudentForm";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function getDepartmentKeyFromDepartmentName(departmentName) {
  const normalizedDepartment = String(departmentName || "").trim().toLowerCase();
  const keys = Object.keys(departmentContent);
  return (
    keys.find((key) =>
      (getDepartmentContent(key)?.studentDepartments || []).some(
        (department) => String(department).trim().toLowerCase() === normalizedDepartment
      )
    ) || null
  );
}

function resolveDepartmentPage(user, fallbackDepartmentKey = "") {
  if (user?.role === "admin") {
    return "admin-dashboard";
  }

  const departmentKey =
    getDepartmentKeyFromUsername(user?.username) ||
    getDepartmentKeyFromDepartmentName(user?.department) ||
    fallbackDepartmentKey;
  if (departmentKey && getDepartmentContent(departmentKey)) {
    return `department:${departmentKey}:overview`;
  }

  return "department-dashboard";
}

function resolveFacultyDashboard(user, fallbackDepartmentKey = "") {
  const departmentKey =
    getDepartmentKeyFromDepartmentName(user?.department) ||
    getDepartmentKeyFromUsername(user?.username) ||
    fallbackDepartmentKey;

  if (departmentKey && getDepartmentContent(departmentKey)) {
    return `faculty:${departmentKey}:dashboard`;
  }

  return resolveDepartmentPage(user, fallbackDepartmentKey);
}

function isFacultyWorkspaceRole(role) {
  return ["faculty", "mentor", "class_advisor", "coordinator"].includes(role);
}

function resolveStudentDashboard(user, fallbackDepartmentKey = "") {
  const departmentKey =
    getDepartmentKeyFromDepartmentName(user?.department) ||
    getDepartmentKeyFromUsername(user?.username) ||
    fallbackDepartmentKey;

  if (departmentKey && getDepartmentContent(departmentKey)) {
    return `student:${departmentKey}:dashboard`;
  }

  return resolveDepartmentPage(user, fallbackDepartmentKey);
}

async function studentHasProfile(username) {
  if (!username) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/students/`, {
      credentials: "include",
    });
    if (!response.ok) {
      return false;
    }

    const records = await response.json();
    return records.some(
      (student) =>
        String(student.regno || "").trim().toUpperCase() ===
        String(username || "").trim().toUpperCase()
    );
  } catch (error) {
    return false;
  }
}

function resolveHodDashboard(user, fallbackDepartmentKey = "") {
  const departmentKey =
    getDepartmentKeyFromUsername(user?.username) || fallbackDepartmentKey;

  if (departmentKey && getDepartmentContent(departmentKey)) {
    return `hod:${departmentKey}:dashboard`;
  }

  return resolveDepartmentPage(user);
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [loginDefaults, setLoginDefaults] = useState({
    portalType: "admin",
    departmentRole: "hod",
    studentOnly: false,
    hodOnly: false,
    departmentKey: "",
  });
  const [loginReturnPage, setLoginReturnPage] = useState("home");
  const [pendingFacultyPasswordReset, setPendingFacultyPasswordReset] = useState(null);
  const [pendingStudentPasswordReset, setPendingStudentPasswordReset] = useState(null);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/status/`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.authenticated) {
          setCurrentUser(data);
          if (data.role === "student" && !(await studentHasProfile(data.username))) {
            setCurrentPage("student-form");
            return;
          }
          setCurrentPage(
            isFacultyWorkspaceRole(data.role)
              ? resolveFacultyDashboard(data)
              : data.role === "student"
                ? resolveStudentDashboard(data)
                : resolveDepartmentPage(data)
          );
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
      setLoginDefaults({
        portalType: "admin",
        departmentRole: "hod",
        studentOnly: false,
        hodOnly: false,
        departmentKey: "",
      });
      setLoginReturnPage("home");
      setPendingFacultyPasswordReset(null);
      setPendingStudentPasswordReset(null);
      setCurrentPage("home");
    }
  };

  const openLogin = (defaults = {}) => {
    const nextDefaults = {
      portalType: "admin",
      departmentRole: "hod",
      studentOnly: false,
      hodOnly: false,
      departmentKey: "",
      ...defaults,
    };
    setLoginDefaults(nextDefaults);
    setLoginReturnPage(currentPage);
    if (nextDefaults.hodOnly) {
      setCurrentPage("hod-login");
      return;
    }
    setCurrentPage(nextDefaults.studentOnly ? "student-login" : "login");
  };

  if (currentPage === "student-form") {
    const fallbackStudentDepartment =
      getDepartmentKeyFromDepartmentName(currentUser?.department) ||
      getDepartmentKeyFromUsername(currentUser?.username) ||
      "";
    return (
      <PortalLayout
        currentPage=""
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        <div className="back-bar">
          <button
            className="back-button"
            onClick={() =>
              setCurrentPage(
                currentUser?.role === "student"
                  ? resolveStudentDashboard(currentUser, fallbackStudentDepartment)
                  : "home"
              )
            }
          >
            Back to Dashboard
          </button>
        </div>
        <StudentForm
          currentUser={currentUser}
          onSuccess={(savedStudent) => {
            if (currentUser?.role === "student") {
              setCurrentUser((prev) => ({
                ...prev,
                department: savedStudent?.department || prev?.department || "",
              }));
              setCurrentPage(
                resolveStudentDashboard(
                  {
                    ...currentUser,
                    department: savedStudent?.department || currentUser?.department || "",
                  },
                  fallbackStudentDepartment
                )
              );
              return;
            }

            setCurrentPage("home");
          }}
        />
      </PortalLayout>
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onBack={() => setCurrentPage(loginReturnPage || "home")}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        initialPortalType={loginDefaults.portalType}
        initialDepartmentRole={loginDefaults.departmentRole}
        initialDepartmentKey={loginDefaults.departmentKey}
        studentOnly={loginDefaults.studentOnly}
        onLoginSuccess={(user) => {
          if (user.requiresPasswordChange) {
            if (isFacultyWorkspaceRole(user.role)) {
              setPendingFacultyPasswordReset({
                username: user.username,
                departmentKey: loginDefaults.departmentKey,
                role: user.role,
              });
              setCurrentPage("faculty-password-change");
              return;
            }

            if (user.role === "student") {
              setPendingStudentPasswordReset({
                username: user.username,
                departmentKey: loginDefaults.departmentKey,
              });
              setCurrentPage("student-password-change");
              return;
            }
          }
          setCurrentUser(user);
          setCurrentPage(
            isFacultyWorkspaceRole(user.role)
              ? resolveFacultyDashboard(user, loginDefaults.departmentKey)
              : user.role === "student"
                ? resolveStudentDashboard(user, loginDefaults.departmentKey)
              : resolveDepartmentPage(user, loginDefaults.departmentKey)
          );
        }}
      />
    );
  }

  if (currentPage === "student-login") {
    return (
      <LoginPage
        onBack={() => setCurrentPage(loginReturnPage || "home")}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        initialPortalType="department"
        initialDepartmentRole="student"
        initialDepartmentKey={loginDefaults.departmentKey}
        studentOnly
        onLoginSuccess={async (user) => {
          if (user.requiresPasswordChange) {
            setPendingStudentPasswordReset({
              username: user.username,
              departmentKey: loginDefaults.departmentKey,
            });
            setCurrentPage("student-password-change");
            return;
          }
          setCurrentUser(user);
          const hasProfile = await studentHasProfile(user.username);
          setCurrentPage(
            hasProfile
              ? resolveStudentDashboard(user, loginDefaults.departmentKey)
              : "student-form"
          );
        }}
      />
    );
  }

  if (currentPage === "faculty-password-change") {
    return (
      <FacultyPasswordChangePage
        onBack={() => setCurrentPage("login")}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        facultyUsername={pendingFacultyPasswordReset?.username || ""}
        activeRole={pendingFacultyPasswordReset?.role || "faculty"}
        departmentKey={pendingFacultyPasswordReset?.departmentKey || ""}
        onSuccess={(user) => {
          setCurrentUser(user);
          setPendingFacultyPasswordReset(null);
          setCurrentPage(
            isFacultyWorkspaceRole(user.role)
              ? resolveFacultyDashboard(user, pendingFacultyPasswordReset?.departmentKey)
              : resolveDepartmentPage(user, pendingFacultyPasswordReset?.departmentKey)
          );
        }}
      />
    );
  }

  if (currentPage === "student-password-change") {
    return (
      <StudentPasswordChangePage
        onBack={() => setCurrentPage("student-login")}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        studentUsername={pendingStudentPasswordReset?.username || ""}
        departmentKey={pendingStudentPasswordReset?.departmentKey || ""}
        onSuccess={(user) => {
          setCurrentUser(user);
          setPendingStudentPasswordReset(null);
          setCurrentPage("student-form");
        }}
      />
    );
  }

  if (currentPage === "hod-login") {
    return (
      <HodLoginPage
        onBack={() => setCurrentPage(loginReturnPage || "home")}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        initialDepartmentKey={loginDefaults.departmentKey}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage(resolveHodDashboard(user, loginDefaults.departmentKey));
        }}
      />
    );
  }

  if (currentPage === "admin-dashboard") {
    return (
      <AdminDashboard
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
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
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage.startsWith("hod:")) {
    const [, departmentKey, activeSection = "dashboard"] = currentPage.split(":");
    return (
      <HodDashboard
        departmentKey={departmentKey}
        activeSection={activeSection}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage.startsWith("faculty:")) {
    const [, departmentKey, activeSection = "dashboard"] = currentPage.split(":");
    return (
      <FacultyDashboard
        departmentKey={departmentKey}
        activeSection={activeSection}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onSessionUserChange={setCurrentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage.startsWith("student:")) {
    const [, departmentKey, activeSection = "dashboard"] = currentPage.split(":");
    return (
      <StudentDashboard
        departmentKey={departmentKey}
        activeSection={activeSection}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage.startsWith("department:")) {
    const [, departmentKey, activeSection = "overview"] = currentPage.split(":");
    return (
      <DepartmentPage
        departmentKey={departmentKey}
        activeSection={activeSection}
        onNavigate={setCurrentPage}
        onOpenStudentForm={() => setCurrentPage("student-form")}
        onOpenLogin={openLogin}
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
        onOpenLogin={openLogin}
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
        onOpenLogin={openLogin}
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
        onOpenLogin={openLogin}
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
        onOpenLogin={openLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      onNavigate={setCurrentPage}
      onOpenStudentForm={() => setCurrentPage("student-form")}
      onOpenLogin={openLogin}
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}

export default App;
