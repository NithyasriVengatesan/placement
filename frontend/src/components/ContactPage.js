import React, { useEffect, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function ContactPage({
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onLogout,
}) {
  const [contactData, setContactData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(`${API_BASE_URL}/portal/contact/`);
        if (!response.ok) {
          throw new Error("Failed to load contact details.");
        }
        setContactData(await response.json());
      } catch (error) {
        setLoadError(error.message || "Unable to load contact details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactDetails();
  }, []);

  return (
    <PortalLayout
      currentPage="contact"
      onNavigate={onNavigate}
      onOpenStudentForm={onOpenStudentForm}
      onOpenLogin={onOpenLogin}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      {isLoading ? (
        <section className="portal-page-card">
          <h1>Loading contact details...</h1>
        </section>
      ) : loadError ? (
        <section className="portal-page-card">
          <h1>Placement Cell Contact</h1>
          <p className="portal-page-text">{loadError}</p>
        </section>
      ) : !contactData || !contactData.title || !contactData.primary_contact ? (
        <section className="portal-page-card">
          <h1>Placement Cell Contact</h1>
          <p className="portal-page-text">No contact details have been added yet.</p>
        </section>
      ) : (
        <>
          <section className="portal-page-card">
            <p className="portal-page-tag">Contact Us</p>
            <h1>{contactData.title}</h1>
            <p className="portal-page-text">{contactData.intro}</p>
          </section>

          <section className="dashboard-grid dashboard-grid-two">
            <article className="dashboard-card">
              <h3>{contactData.primary_contact.name}</h3>
              <ul className="portal-bullet-list">
                <li>Phone: {contactData.primary_contact.phone}</li>
                <li>Email: {contactData.primary_contact.email}</li>
                <li>Office Hours: {contactData.office_hours}</li>
                <li>Address: {contactData.address}</li>
              </ul>
            </article>

            <article className="dashboard-card">
              <h3>Support Channels</h3>
              <ul className="portal-bullet-list">
                {contactData.contacts.map((contact) => (
                  <li key={contact.title}>
                    <strong>{contact.title}:</strong> {contact.detail}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </PortalLayout>
  );
}

export default ContactPage;
