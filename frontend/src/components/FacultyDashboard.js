import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import PortalLayout from "./PortalLayout";
import { getDepartmentContent } from "./departmentContent";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const facultySections = [
  { key: "dashboard", label: "Dashboard" },
  { key: "students", label: "Students" },
  { key: "profile", label: "Profile" },
];

function toNumber(value) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

const ROLE_LABELS = {
  faculty: "Faculty",
  mentor: "Mentor",
  class_advisor: "Class Advisor",
  coordinator: "Coordinator",
};

async function getResponseErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail;
    }
    return fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

function FacultyDashboard({
  departmentKey,
  activeSection = "dashboard",
  onNavigate,
  onOpenStudentForm,
  onOpenLogin,
  currentUser,
  onSessionUserChange,
  onLogout,
}) {
  const content = getDepartmentContent(departmentKey);
  const [students, setStudents] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [studentAccountsLoadError, setStudentAccountsLoadError] = useState("");
  const [studentAccountForm, setStudentAccountForm] = useState({ regno: "" });
  const [studentSubmitMessage, setStudentSubmitMessage] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState("");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [switchRoleMessage, setSwitchRoleMessage] = useState("");
  const [switchingRole, setSwitchingRole] = useState("");
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(null);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!content) {
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        setStudentAccountsLoadError("");
        const department = content?.studentDepartments?.[0];
        const allowedDepartments = content?.studentDepartments || [];
        const errors = [];
        const [studentResponse, facultyResponse, studentAccountResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/students/`, {
            credentials: "include",
          }),
          department
            ? fetch(
                `${API_BASE_URL}/faculty-accounts/?department=${encodeURIComponent(department)}`,
                {
                  credentials: "include",
                }
              )
            : Promise.resolve({ ok: true, json: async () => [] }),
          department
            ? fetch(
                `${API_BASE_URL}/student-accounts/?department=${encodeURIComponent(department)}`,
                {
                  credentials: "include",
                }
              )
            : Promise.resolve({ ok: true, json: async () => [] }),
        ]);

        if (studentResponse.status === "fulfilled" && studentResponse.value.ok) {
          const studentRecords = await studentResponse.value.json();
          setStudents(
            studentRecords.filter((student) => allowedDepartments.includes(student.department))
          );
        } else {
          setStudents([]);
          errors.push("student records");
        }

        if (facultyResponse.status === "fulfilled" && facultyResponse.value.ok) {
          const facultyRecords = await facultyResponse.value.json();
          setFacultyMembers(facultyRecords);
        } else {
          setFacultyMembers([]);
          errors.push("faculty records");
        }

        if (studentAccountResponse.status === "fulfilled" && studentAccountResponse.value.ok) {
          const studentAccountRecords = await studentAccountResponse.value.json();
          setStudentAccounts(studentAccountRecords);
        } else {
          setStudentAccounts([]);
          if (studentAccountResponse.status === "fulfilled") {
            setStudentAccountsLoadError(
              await getResponseErrorMessage(
                studentAccountResponse.value,
                "Unable to load student login records."
              )
            );
          } else {
            setStudentAccountsLoadError("Unable to load student login records.");
          }
          errors.push("student login records");
        }

        if (errors.length) {
          setLoadError(`Some dashboard sections could not load: ${errors.join(", ")}.`);
        }
      } catch (error) {
        setLoadError(error.message || "Unable to load faculty dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [content, currentUser]);

  const facultyRecord =
    facultyMembers.find(
      (member) =>
        String(member.fac_username || "").trim().toLowerCase() ===
        String(currentUser?.username || "").trim().toLowerCase()
    ) || null;

  const facultyIdentifiers = useMemo(
    () =>
      new Set(
        [
          currentUser?.username,
          facultyRecord?.employeeId,
          facultyRecord?.fac_username,
          facultyRecord?.name,
        ]
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean)
      ),
    [currentUser?.username, facultyRecord]
  );

  const facultyRoles = new Set(
    [
      ...(currentUser?.availableRoles || []),
      ...(facultyRecord?.roles || []),
      currentUser?.role || "faculty",
      "faculty",
    ]
      .map((role) => String(role || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const availableRoles = Array.from(facultyRoles);
  const activePortalRole = currentUser?.activeRole || currentUser?.role || "faculty";
  const activeRoleLabel = ROLE_LABELS[activePortalRole] || "Faculty";

  const mappedStudents = useMemo(
    () => {
      if (activePortalRole === "coordinator" || activePortalRole === "faculty") {
        return students;
      }

      return students.filter((student) => {
        const assignmentValues =
          activePortalRole === "mentor"
            ? [student.mentor, student.mentorName]
            : [student.classAdvisor, student.classAdvisorName];

        return assignmentValues.some((value) =>
          facultyIdentifiers.has(String(value || "").trim().toLowerCase())
        );
      });
    },
    [activePortalRole, facultyIdentifiers, students]
  );

  const mappedStudentRegnos = useMemo(
    () =>
      new Set(
        mappedStudents
          .map((student) => String(student.regno || "").trim().toUpperCase())
          .filter(Boolean)
      ),
    [mappedStudents]
  );

  const visibleStudentAccounts = useMemo(
    () =>
      studentAccounts.filter((account) => {
        if (activePortalRole === "coordinator" || activePortalRole === "faculty") {
          return true;
        }

        const assignmentValues =
          activePortalRole === "mentor"
            ? [account.mentor, account.mentorName]
            : [account.classAdvisor, account.classAdvisorName];

        const hasDirectAssignment = assignmentValues.some((value) =>
          facultyIdentifiers.has(String(value || "").trim().toLowerCase())
        );

        if (hasDirectAssignment) {
          return true;
        }

        return mappedStudentRegnos.has(
          String(account.username || account.regno || "").trim().toUpperCase()
        );
      }),
    [activePortalRole, facultyIdentifiers, mappedStudentRegnos, studentAccounts]
  );
  const metrics = useMemo(() => {
    const totalStudents = mappedStudents.length;
    const eligibleStudents = mappedStudents.filter(
      (student) => String(student.eligibility || "").toLowerCase() === "eligible"
    ).length;
    const placedStudents = mappedStudents.filter(
      (student) => String(student.placement || "").trim() !== ""
    ).length;
    const averageCgpa = totalStudents
      ? (
          mappedStudents.reduce((sum, student) => sum + toNumber(student.cgpa), 0) /
          totalStudents
        ).toFixed(2)
      : "0.00";
    const productivity = totalStudents
      ? Math.round((eligibleStudents / totalStudents) * 100)
      : 0;

    return {
      totalStudents,
      eligibleStudents,
      placedStudents,
      averageCgpa,
      productivity,
    };
  }, [mappedStudents]);

  const buildFacultyPage = (section) => `faculty:${departmentKey}:${section}`;
  const activeSectionLabel =
    facultySections.find((item) => item.key === activeSection)?.label || "Dashboard";
  const canOpenHodLogin = Boolean(facultyRecord?.isHod);
  const avatarLabel = String(facultyRecord?.name || currentUser?.username || "F")
    .charAt(0)
    .toUpperCase();
  const avatarPhoto = facultyRecord?.profilePhoto || "";

  const overviewCards = [
    {
      title: "Student Review",
      day: "Mon",
      number: "18",
      value: `${metrics.productivity}%`,
      detail: `${metrics.eligibleStudents} eligible students`,
      tone: "lime",
    },
    {
      title: "Placement Focus",
      day: "Tue",
      number: "19",
      value: `${metrics.placedStudents}`,
      detail: "placed profiles tracked",
      tone: "mint",
    },
    {
      title: "Academic Review",
      day: "Wed",
      number: "20",
      value: metrics.averageCgpa,
      detail: "department average CGPA",
      tone: "teal",
    },
  ];

  const scheduleItems = [
    { title: "Resume Review Session", time: "09:30 AM", note: "Working on student profiles" },
    { title: "Mock Interview Slot", time: "10:40 AM", note: "Technical preparation" },
    { title: "Placement Status Update", time: "11:50 AM", note: "Tracking company progress" },
  ];

  const switchRole = async (nextRole) => {
    try {
      setSwitchingRole(nextRole);
      setSwitchRoleMessage("");
      const response = await fetch(`${API_BASE_URL}/auth/switch-role/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to switch profile.");
      }
      onSessionUserChange?.(data);
      setSwitchRoleMessage(
        `Switched to ${ROLE_LABELS[nextRole] || "Faculty"} profile.`
      );
      setIsRoleMenuOpen(false);
    } catch (error) {
      setSwitchRoleMessage(error.message || "Unable to switch profile.");
    } finally {
      setSwitchingRole("");
    }
  };

  const switchUserOptions = [
    {
      key: "faculty",
      title: "Faculty",
      description: "Open the faculty workspace.",
      active: activePortalRole === "faculty",
      disabled: activePortalRole === "faculty" || switchingRole === "faculty",
      visible: availableRoles.includes("faculty"),
      onClick: () => switchRole("faculty"),
    },
    {
      key: "mentor",
      title: "Mentor",
      description: "Open the mentor workspace.",
      active: activePortalRole === "mentor",
      disabled: activePortalRole === "mentor" || switchingRole === "mentor",
      visible: availableRoles.includes("mentor") || Boolean(facultyRecord?.mentor),
      onClick: () => switchRole("mentor"),
    },
    {
      key: "class_advisor",
      title: "Class Advisor",
      description: "Open the class advisor workspace.",
      active: activePortalRole === "class_advisor",
      disabled: activePortalRole === "class_advisor" || switchingRole === "class_advisor",
      visible: availableRoles.includes("class_advisor"),
      onClick: () => switchRole("class_advisor"),
    },
    {
      key: "coordinator",
      title: "Coordinator",
      description: "Open the coordinator workspace.",
      active: activePortalRole === "coordinator",
      disabled: activePortalRole === "coordinator" || switchingRole === "coordinator",
      visible: availableRoles.includes("coordinator"),
      onClick: () => switchRole("coordinator"),
    },
    {
      key: "hod",
      title: "HOD",
      description: "Open HOD login for this department.",
      active: false,
      disabled: false,
      visible: canOpenHodLogin,
      onClick: () => {
        setIsRoleMenuOpen(false);
        onOpenLogin?.({
          portalType: "department",
          departmentRole: "hod",
          hodOnly: true,
          departmentKey,
        });
      },
    },
  ].filter((option) => option.visible);

  const renderAvatar = (className) =>
    avatarPhoto ? (
      <img src={avatarPhoto} alt={facultyRecord?.name || "Faculty"} className={className} />
    ) : (
      <div className={className}>{avatarLabel}</div>
    );

  const handleProfilePhotoUpload = async () => {
    if (!selectedProfilePhoto || !currentUser?.username) {
      setProfileUpdateMessage("Choose a photo first.");
      return;
    }

    try {
      setIsUploadingProfilePhoto(true);
      setProfileUpdateMessage("");
      const formData = new FormData();
      formData.append("username", currentUser.username);
      formData.append("profilePhoto", selectedProfilePhoto);

      const response = await fetch(`${API_BASE_URL}/faculty-accounts/profile/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to update profile photo.");
      }

      setFacultyMembers((current) =>
        current.map((member) =>
          String(member.fac_username || "").trim().toLowerCase() ===
          String(currentUser?.username || "").trim().toLowerCase()
            ? { ...member, ...data }
            : member
        )
      );
      setSelectedProfilePhoto(null);
      setProfileUpdateMessage("Profile photo updated successfully.");
    } catch (error) {
      setProfileUpdateMessage(error.message || "Unable to update profile photo.");
    } finally {
      setIsUploadingProfilePhoto(false);
    }
  };

  const renderStudentsPanel = () => (
    <div className="faculty-panel-stack">
      <section className="faculty-surface-card">
        <p className="portal-page-tag">{activeRoleLabel} Students</p>
        <h2>
          {activePortalRole === "mentor"
            ? "Student Records for Mentoring"
            : activePortalRole === "class_advisor"
              ? "Class Advisor Student Records"
              : activePortalRole === "coordinator"
                ? "Coordinator Student Records"
                : "Faculty Student Records"}
        </h2>
        <p className="portal-page-text">
          {activePortalRole === "mentor"
            ? "Review only the students mapped to you as mentor."
            : activePortalRole === "class_advisor"
              ? "Review only the students mapped to you as class advisor."
              : activePortalRole === "coordinator"
                ? "Review department-wide student records and progress from the coordinator view."
                : "Review department student records and add student login accounts by register number."}
        </p>
      </section>

      {activePortalRole === "faculty" ? (
        <section className="faculty-surface-card">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="student-regno">Register Number</label>
              <input
                id="student-regno"
                type="text"
                value={studentAccountForm.regno}
                onChange={(event) =>
                  setStudentAccountForm({ regno: event.target.value.toUpperCase() })
                }
                placeholder="Enter student register number"
              />
            </div>
          </div>
          <div className="form-navigation">
            <div className="portal-page-text">
              {studentSubmitMessage ||
                "Add student login accounts by register number. Assigned students will appear below once HOD maps them to you."}
            </div>
            <button
              type="button"
              disabled={isSubmittingStudent}
              onClick={async () => {
                const regno = studentAccountForm.regno.trim().toUpperCase();
                const department = content?.studentDepartments?.[0] || "";
                if (!regno || !department) {
                  setStudentSubmitMessage("Register number is required.");
                  return;
                  }
                  try {
                  setIsSubmittingStudent(true);
                  setStudentSubmitMessage("");
                  const response = await fetch(`${API_BASE_URL}/student-accounts/`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      regno,
                      department,
                      addedBy: currentUser?.username || "",
                    }),
                  });
                  const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.detail || "Unable to add student account.");
                    }
                    setStudentAccounts((current) => [data, ...current]);
                    setStudentAccountForm({ regno: "" });
                    setStudentSubmitMessage("Student account added successfully.");
                  } catch (error) {
                    setStudentSubmitMessage(error.message || "Unable to add student account.");
                  } finally {
                  setIsSubmittingStudent(false);
                }
              }}
            >
              {isSubmittingStudent ? "Saving..." : "Add Student"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="faculty-surface-card">
        <h3>Student Login Records</h3>
        {studentAccountsLoadError ? (
          <p className="portal-page-text">{studentAccountsLoadError}</p>
        ) : null}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Register No</th>
                <th>Profile</th>
                <th>First Login</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudentAccounts.length ? (
                visibleStudentAccounts.map((student) => (
                  <tr key={student.id || student.username}>
                    <td>{student.username}</td>
                    <td>{`${student.profileCompletion || 0}%`}</td>
                    <td>{student.must_change_password ? "Pending" : "Completed"}</td>
                    <td>{student.department || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-action-button admin-action-button-danger"
                        disabled={deletingStudentId === student.id}
                        onClick={async () => {
                          const isConfirmed = window.confirm(
                            `Are you sure you want to remove ${student.username}?`
                          );
                          if (!isConfirmed) {
                            return;
                          }

                          try {
                            setDeletingStudentId(student.id);
                            setStudentSubmitMessage("");
                            const response = await fetch(
                              `${API_BASE_URL}/student-accounts/${student.id}/`,
                              {
                                method: "DELETE",
                                credentials: "include",
                              }
                            );
                            const data = await response.json();
                            if (!response.ok) {
                              throw new Error(data.detail || "Unable to delete student account.");
                            }
                            setStudentAccounts((current) =>
                              current.filter((item) => item.id !== student.id)
                            );
                            setStudentSubmitMessage("Student account removed successfully.");
                          } catch (error) {
                            setStudentSubmitMessage(
                              error.message || "Unable to delete student account."
                            );
                          } finally {
                            setDeletingStudentId("");
                          }
                        }}
                      >
                        {deletingStudentId === student.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No mapped student login records available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="faculty-surface-card">
        <h3>Submitted Student Details</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Register No</th>
                <th>CGPA</th>
                <th>Eligibility</th>
                <th>Placement</th>
              </tr>
            </thead>
            <tbody>
              {mappedStudents.map((student) => (
                <tr key={student.regno}>
                  <td>{`${student.firstName || ""} ${student.lastName || ""}`.trim()}</td>
                  <td>{student.regno}</td>
                  <td>{student.cgpa || "-"}</td>
                  <td>{student.eligibility || "-"}</td>
                  <td>{student.placement || "Pending"}</td>
                </tr>
              ))}
              {mappedStudents.length === 0 ? (
                <tr>
                  <td colSpan="5">No students are assigned to you yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderProfilePanel = () => (
    <div className="faculty-panel-stack">
      <section className="faculty-surface-card">
        <p className="portal-page-tag">{activeRoleLabel} Profile</p>
        <h2>{facultyRecord?.name || currentUser?.username || `${activeRoleLabel} Member`}</h2>
        <p className="portal-page-text">
          {facultyRecord?.position || `${activeRoleLabel} Member`} in {content.title}
        </p>
        {loadError ? <p className="portal-page-text">{loadError}</p> : null}
      </section>
      <section className="faculty-profile-editor">
        <article className="faculty-profile-hero faculty-profile-hero-wide">
          {renderAvatar("faculty-profile-avatar")}
          <h3>{facultyRecord?.name || currentUser?.username || "Faculty"}</h3>
          <p>{facultyRecord?.position || activeRoleLabel}</p>
          <label className="faculty-photo-upload-label" htmlFor="faculty-profile-photo">
            Add Profile Photo
          </label>
          <input
            id="faculty-profile-photo"
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={(event) => {
              setSelectedProfilePhoto(event.target.files?.[0] || null);
              setProfileUpdateMessage("");
            }}
          />
          <button
            type="button"
            onClick={handleProfilePhotoUpload}
            disabled={isUploadingProfilePhoto}
          >
            {isUploadingProfilePhoto ? "Uploading..." : "Update Photo"}
          </button>
          {selectedProfilePhoto ? (
            <small className="faculty-profile-upload-note">{selectedProfilePhoto.name}</small>
          ) : null}
          {profileUpdateMessage ? (
            <small className="faculty-profile-upload-note">{profileUpdateMessage}</small>
          ) : null}
        </article>
      </section>
      <section className="faculty-profile-grid">
        <article className="faculty-profile-card">
          <span>Name</span>
          <strong>{facultyRecord?.name || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Department</span>
          <strong>{facultyRecord?.department || content.studentDepartments?.[0] || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Degree</span>
          <strong>{facultyRecord?.degree || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Employee ID</span>
          <strong>{facultyRecord?.employeeId || facultyRecord?.fac_username || currentUser?.username || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Position</span>
          <strong>{facultyRecord?.position || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Access</span>
          <strong>
            {[
              facultyRecord?.isHod ? "HOD" : "",
              "Faculty",
              facultyRecord?.mentor ? "Mentor" : "",
              (facultyRecord?.roles || []).includes("class_advisor") ? "Class Advisor" : "",
              (facultyRecord?.roles || []).includes("coordinator") ? "Coordinator" : "",
            ]
              .filter(Boolean)
              .join(" | ")}
          </strong>
        </article>
        <article className="faculty-profile-card">
          <span>Class</span>
          <strong>{facultyRecord?.className || "-"}</strong>
        </article>
        <article className="faculty-profile-card">
          <span>Section</span>
          <strong>{facultyRecord?.section || "-"}</strong>
        </article>
      </section>
    </div>
  );

  const renderDashboardPanel = () => (
    <div className="faculty-panel-stack">
      <section className="faculty-hero-card">
        <div className="faculty-hero-main">
          <div className="faculty-hero-copy">
            <p className="portal-page-tag">{activeRoleLabel} Workspace</p>
            <h1>{activePortalRole === "mentor" ? "Mentor Productivity" : "Working Productivity"}</h1>
            <p className="faculty-hero-text">
              {activePortalRole === "mentor"
                ? `Track mentoring coverage, student momentum, and follow-up progress for ${content.title}.`
                : `Track placement readiness, student momentum, and daily review progress for ${content.title}.`}
            </p>
            {loadError ? <p className="portal-page-text">{loadError}</p> : null}
          </div>
          <div className="faculty-hero-search">
            <input type="text" placeholder="Search for anything..." />
          </div>
        </div>

        <div className="faculty-overview-grid">
          <div className="faculty-task-stack">
            {overviewCards.map((card) => (
              <article className={`faculty-task-card faculty-task-card-${card.tone}`} key={card.title}>
                <div className="faculty-task-date">
                  <span>{card.day}</span>
                  <strong>{card.number}</strong>
                </div>
                <div className="faculty-task-copy">
                  <span>{card.title}</span>
                  <strong>{card.value}</strong>
                  <small>{card.detail}</small>
                </div>
              </article>
            ))}
          </div>

          <article className="faculty-stats-card">
            <h3>Statistics</h3>
            <div className="faculty-stats-ring">
              <div className="faculty-stats-ring-core">
                <strong>{metrics.productivity}%</strong>
                <span>Ready</span>
              </div>
            </div>
            <div className="faculty-stat-bars">
              <div className="faculty-stat-bar-row">
                <span>Eligible</span>
                <strong>{metrics.eligibleStudents}</strong>
              </div>
              <div className="faculty-stat-bar-row">
                <span>Placed</span>
                <strong>{metrics.placedStudents}</strong>
              </div>
              <div className="faculty-stat-bar-row">
                <span>Average CGPA</span>
                <strong>{metrics.averageCgpa}</strong>
              </div>
            </div>
          </article>

          <aside className="faculty-profile-hero">
            {renderAvatar("faculty-profile-avatar")}
            <h3>{facultyRecord?.name || currentUser?.username || "Faculty"}</h3>
            <p>{activeRoleLabel} Access</p>
            <button type="button" onClick={() => onNavigate(buildFacultyPage("profile"))}>
              View Profile
            </button>
            <div className="faculty-profile-hours">
              <div>
                <span>Work Start</span>
                <strong>09:00 am</strong>
              </div>
              <div>
                <span>Work End</span>
                <strong>05:00 pm</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="faculty-bottom-grid">
        <article className="faculty-surface-card">
          <h3>Upcoming Activity</h3>
          <div className="faculty-activity-list">
            <div className="faculty-activity-row">
              <span>Tue</span>
              <strong>Resume Screening</strong>
            </div>
            <div className="faculty-activity-row">
              <span>Wed</span>
              <strong>Mentor Coordination</strong>
            </div>
            <div className="faculty-activity-row">
              <span>Thu</span>
              <strong>Placement Readiness Review</strong>
            </div>
          </div>
        </article>

        <article className="faculty-surface-card">
          <h3>Upcoming Schedule</h3>
          <div className="faculty-schedule-list">
            {scheduleItems.map((item) => (
              <article className="faculty-schedule-card" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.note}</p>
                </div>
                <span>{item.time}</span>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );

  const renderPanel = () => {
    if (isLoading) {
      return (
        <section className="faculty-surface-card">
          <h2>Loading faculty dashboard...</h2>
        </section>
      );
    }

    if (activeSection === "students") {
      return renderStudentsPanel();
    }

    if (activeSection === "profile") {
      return renderProfilePanel();
    }

    if (loadError) {
      return (
        <section className="faculty-surface-card">
          <h2>Faculty Dashboard</h2>
          <p className="portal-page-text">{loadError}</p>
        </section>
      );
    }

    return renderDashboardPanel();
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
      <div className="admin-dashboard-shell faculty-dashboard-shell">
        <aside className="admin-sidebar faculty-sidebar">
          <div className="admin-sidebar-brand">
            <p className="admin-sidebar-tag">{content?.sidebarTitle || departmentKey.toUpperCase()}</p>
            <h2>{activeRoleLabel} Panel</h2>
          </div>

          <nav className="admin-sidebar-nav">
            {facultySections.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar-link ${activeSection === item.key ? "active" : ""}`}
                onClick={() => onNavigate(buildFacultyPage(item.key))}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-profile-trigger admin-sidebar-profile-static">
              {renderAvatar("admin-sidebar-avatar")}
              <div className="admin-sidebar-profile-copy">
                <span className="admin-sidebar-profile-title">
                  {facultyRecord?.name || currentUser?.username || "Faculty"}
                </span>
                <span className="admin-sidebar-profile-subtitle">
                  {activeRoleLabel} | {facultyRecord?.employeeId || facultyRecord?.fac_username || currentUser?.username || ""}
                </span>
              </div>
            </div>

            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </aside>

        <div className="admin-dashboard-main">
          <div className="faculty-topbar">
            <div className="faculty-topbar-copy">
              <p className="portal-page-tag">{content?.sidebarTitle || departmentKey.toUpperCase()}</p>
              <h2>{activeSectionLabel}</h2>
            </div>

            <div className="faculty-profile-menu-shell">
              <button
                type="button"
                className="faculty-profile-menu-trigger"
                onClick={() => {
                  setIsRoleMenuOpen((current) => !current);
                  setSwitchRoleMessage("");
                }}
              >
                {renderAvatar("faculty-profile-menu-avatar")}
                <div className="faculty-profile-menu-copy">
                  <strong>{facultyRecord?.name || currentUser?.username || "Faculty"}</strong>
                  <span>{activeRoleLabel}</span>
                </div>
                <span className="faculty-profile-menu-caret">{isRoleMenuOpen ? "▴" : "▾"}</span>
              </button>

              {isRoleMenuOpen ? (
                <div className="faculty-profile-dropdown">
                  <span className="faculty-profile-dropdown-label">Switch User</span>
                  {switchUserOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`faculty-profile-dropdown-option ${
                        option.active ? "active" : ""
                      }`}
                      disabled={option.disabled}
                      onClick={option.onClick}
                    >
                      <strong>
                        {option.key === switchingRole ? "Switching..." : option.title}
                      </strong>
                      <span>{option.description}</span>
                    </button>
                  ))}

                  {switchRoleMessage ? (
                    <small className="faculty-profile-dropdown-message">{switchRoleMessage}</small>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {renderPanel()}
        </div>
      </div>
    </PortalLayout>
  );
}

export default FacultyDashboard;
