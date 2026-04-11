import React from "react";
import "../App.css";
import Header from "./Header";
import Footer from "./Footer";

export const navigationItems = [
  { key: "home", label: "Home" },
  { key: "placement-details", label: "Placement Details" },
  { key: "interns", label: "Interns" },
  { key: "hirings", label: "Hirings" },
  { key: "contact", label: "Contact Us" },
];

export function PortalSubnav({ currentPage, onNavigate, onOpenStudentForm }) {
  return (
    <div className="subnav">
      <div className="subnav-inner">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`subnav-link ${currentPage === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={`subnav-link ${currentPage === "student-form" ? "active" : ""}`}
          onClick={onOpenStudentForm}
        >
          Student Form
        </button>
      </div>
    </div>
  );
}

function PortalLayout({
  currentPage,
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
  hideHeaderAuth = false,
  contentClassName = "",
  children,
}) {
  return (
    <div className="app-wrapper">
      <Header
        onOpenLogin={onOpenLogin}
        currentUser={currentUser}
        onLogout={onLogout}
        hideAuthControls={hideHeaderAuth}
      />

      <PortalSubnav
        currentPage={currentPage}
        onNavigate={onNavigate}
        onOpenStudentForm={onOpenStudentForm}
      />

      <main className="main-content">
        <div className={`container ${contentClassName}`.trim()}>{children}</div>
      </main>

      <Footer />
    </div>
  );
}

export default PortalLayout;
