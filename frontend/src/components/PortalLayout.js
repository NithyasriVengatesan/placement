import React from "react";
import "../App.css";
import Header from "./Header";
import Footer from "./Footer";

const navigationItems = [
  { key: "home", label: "Home" },
  { key: "placement-details", label: "Placement Details" },
  { key: "interns", label: "Interns" },
  { key: "hirings", label: "Hirings" },
  { key: "contact", label: "Contact Us" },
];

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
          <button onClick={onOpenStudentForm}>4th Year Form</button>
        </div>
      </div>

      <main className="main-content">
        <div className={`container ${contentClassName}`.trim()}>{children}</div>
      </main>

      <Footer />
    </div>
  );
}

export default PortalLayout;
