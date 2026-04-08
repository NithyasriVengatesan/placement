import React, { useCallback, useEffect, useState } from "react";
import ProgressBar from "./components/ProgressBar";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const initialFormData = {
  classAdvisor: "",
  firstName: "",
  lastName: "",
  department: "",
  degree: "",
  year: "",
  dob: "",
  age: "",
  gender: "",
  blood: "",
  aadhar: "",
  passportAvailability: "No",
  languagesKnown: [{ language: "", proficiencyTestLevel: "" }],
  primaryEmail: "",
  secondaryEmail: "",
  phoneNumber: "",
  whatsappNumber: "",
  residentialAddress: "",
  fatherName: "",
  motherName: "",
  fatherMobileNumber: "",
  motherMobileNumber: "",
  income: "",
  fatherOccupation: "",
  fatherOrganizationName: "",
  fatherOrganizationContactNumber: "",
  motherOccupation: "",
  motherOrganizationName: "",
  motherOrganizationContactNumber: "",
  regno: "",
  sslcBoard: "",
  sslcSchoolName: "",
  sslcLocation: "",
  sslcRegisterNo: "",
  sslcPercentage: "",
  sslcYear: "",
  hscBoard: "",
  hscSchoolName: "",
  hscLocation: "",
  hscRegisterNo: "",
  hscPercentage: "",
  hscYear: "",
  diplomaSpecialization: "",
  diplomaInstitute: "",
  diplomaLocation: "",
  diplomaRegisterNo: "",
  diplomaPercentage: "",
  diplomaYear: "",
  gpaSem1: "",
  gpaSem2: "",
  gpaSem3: "",
  gpaSem4: "",
  gpaSem5: "",
  gpaSem6: "",
  gpaSem7: "",
  cgpa: "",
  currentArrears: "0",
  historyArrears: "0",
  eligibility: "",
  hardwareSkills: "",
  softwareSkills: "",
  domainSkills: "",
  projects: [{ title: "", technology: "", description: "" }],
  internships: [{ company: "", role: "", duration: "" }],
  certifications: [{ certification: "", platform: "", credentialId: "" }],
  participatePlacement: "",
  noReason: "",
  companyTraining: "",
  agencyTraining: "",
  interestedDomains: [],
  otherDetails: "",
  batch: "",
  placement: "",
  declarationAgreed: false,
};

const initialFiles = {
  passportDocument: null,
  tenthMarksheet: null,
  twelfthMarksheet: null,
  collegeIdCard: null,
  aadharCard: null,
  semesterMarksheets: [],
};

const departmentOptions = [
  "CSE",
  "CSE(AI &ML)",
  "AIDS",
  "IT",
  "CSBS",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
];

const interestedDomainOptions = [
  "IT",
  "Core",
  "Both IT & Core",
  "Learning and Development Company",
  "SalesForce/Digital Marketing/Customer Relationship(CRM)",
  "Artificial Intelligence & Machine Learning/Data Science",
  "Cyber Security",
];

const boardOptions = ["CBSE", "STATE BOARD", "MATRICULATION", "ICSE"];

function StudentForm({ currentUser = null, existingStudent = null, onSuccess = null }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState(initialFiles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [profileRecord, setProfileRecord] = useState(existingStudent || null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const mergeStudentProfile = useCallback((studentRecord) => {
    if (!studentRecord) {
      return;
    }

    setProfileRecord(studentRecord);
    setFormData((prev) => ({
      ...prev,
      ...studentRecord,
      languagesKnown:
        studentRecord.languagesKnown?.length
          ? studentRecord.languagesKnown
          : prev.languagesKnown,
      projects: studentRecord.projects?.length ? studentRecord.projects : prev.projects,
      internships:
        studentRecord.internships?.length ? studentRecord.internships : prev.internships,
      certifications:
        studentRecord.certifications?.length
          ? studentRecord.certifications
          : prev.certifications,
      interestedDomains:
        studentRecord.interestedDomains?.length
          ? studentRecord.interestedDomains
          : prev.interestedDomains,
      regno: currentUser?.username || studentRecord.regno || prev.regno,
      department: studentRecord.department || currentUser?.department || prev.department,
    }));
  }, [currentUser]);

  useEffect(() => {
    mergeStudentProfile(existingStudent);
  }, [existingStudent, mergeStudentProfile]);

  useEffect(() => {
    if (!currentUser?.username || existingStudent) {
      return;
    }

    let isMounted = true;
    const fetchExistingProfile = async () => {
      try {
        setIsProfileLoading(true);
        const response = await fetch(`${API_BASE_URL}/students/`);
        if (!response.ok) {
          throw new Error("Unable to load student profile.");
        }

        const studentRecords = await response.json();
        const matchedProfile =
          studentRecords.find(
            (student) =>
              String(student.regno || "").trim().toUpperCase() ===
              String(currentUser.username || "").trim().toUpperCase()
          ) || null;

        if (isMounted && matchedProfile) {
          mergeStudentProfile(matchedProfile);
        }
      } catch (error) {
        if (isMounted) {
          setSubmitError(error.message || "Unable to load student profile.");
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    fetchExistingProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser, existingStudent, mergeStudentProfile]);

  useEffect(() => {
    const semesterValues = [
      formData.gpaSem1,
      formData.gpaSem2,
      formData.gpaSem3,
      formData.gpaSem4,
      formData.gpaSem5,
      formData.gpaSem6,
      formData.gpaSem7,
    ]
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value) && value > 0);

    if (!semesterValues.length) {
      setFormData((prev) => ({ ...prev, cgpa: "" }));
      return;
    }

    const average =
      semesterValues.reduce((sum, value) => sum + value, 0) / semesterValues.length;

    setFormData((prev) => ({ ...prev, cgpa: average.toFixed(2) }));
  }, [
    formData.gpaSem1,
    formData.gpaSem2,
    formData.gpaSem3,
    formData.gpaSem4,
    formData.gpaSem5,
    formData.gpaSem6,
    formData.gpaSem7,
  ]);

  const next = () => step < 12 && setStep(step + 1);
  const back = () => step > 1 && setStep(step - 1);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (field, index, key, value) => {
    setFormData((prev) => {
      const updated = [...prev[field]];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field, emptyItem) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], emptyItem],
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleDOBChange = (event) => {
    const value = event.target.value;
    updateField("dob", value);

    if (!value) {
      updateField("age", "");
      return;
    }

    const birthDate = new Date(value);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge -= 1;
    }

    updateField("age", calculatedAge);
  };

  const validatePhoneNumber = (value) => !value || /^\d{10}$/.test(value);
  const validateEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateSingleFile = (file) => {
    if (!file) {
      return "File is required.";
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only PDF, JPG, and PNG files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size should be 5MB or less.";
    }
    return "";
  };

  const handleSingleFileUpload = (field, event) => {
    const file = event.target.files[0];
    const error = validateSingleFile(file);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError("");
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleMultipleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      setSubmitError("Please upload at least one semester marksheet.");
      return;
    }

    for (const file of selectedFiles) {
      const error = validateSingleFile(file);
      if (error) {
        setSubmitError(error);
        return;
      }
    }

    setSubmitError("");
    setFiles((prev) => ({ ...prev, semesterMarksheets: selectedFiles }));
  };

  const handleDomainChange = (domain, checked) => {
    const existing = formData.interestedDomains;
    updateField(
      "interestedDomains",
      checked ? [...existing, domain] : existing.filter((item) => item !== domain)
    );
  };

  const validateForm = () => {
    const existingDocuments = existingStudent?.documents || {};

    if (!formData.classAdvisor || !formData.firstName || !formData.lastName || !formData.primaryEmail) {
      return "Please complete the required details in Phase 1.";
    }

    if (!formData.languagesKnown[0]?.language) {
      return "Please enter at least one known language.";
    }

    if (!validateEmail(formData.primaryEmail) || !validateEmail(formData.secondaryEmail)) {
      return "Please enter valid email addresses.";
    }

    if (
      !validatePhoneNumber(formData.phoneNumber) ||
      !validatePhoneNumber(formData.whatsappNumber) ||
      !validatePhoneNumber(formData.fatherMobileNumber) ||
      !validatePhoneNumber(formData.motherMobileNumber)
    ) {
      return "Phone numbers must contain exactly 10 digits.";
    }

    if (!files.tenthMarksheet && !existingDocuments.tenthMarksheet) {
      return "Please upload 10th marksheet.";
    }

    if (!files.twelfthMarksheet && !existingDocuments.twelfthMarksheet) {
      return "Please upload 12th marksheet.";
    }

    if (!files.collegeIdCard && !existingDocuments.collegeIdCard) {
      return "Please upload college ID card.";
    }

    if (!files.aadharCard && !existingDocuments.aadharCard) {
      return "Please upload aadhar card.";
    }

    if (!files.semesterMarksheets.length && !(existingDocuments.semesterMarksheets || []).length) {
      return "Please upload all semester marksheets.";
    }

    if (formData.passportAvailability === "Yes" && !files.passportDocument && !existingDocuments.passportDocument) {
      return "Please upload the passport PDF.";
    }

    if (!formData.declarationAgreed || !formData.placement) {
      return "Please complete the declaration phase.";
    }

    if (!formData.eligibility) {
      return "Please select the eligibility field in placement details.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      alert(validationError);
      return;
    }

    if (profileRecord) {
      const confirmed = window.confirm(
        "Are you sure you want to update your profile? This will replace your existing details in the backend."
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSubmitMessage("");

      const payload = new FormData();
      payload.append("form_payload", JSON.stringify(formData));
      if (files.passportDocument) {
        payload.append("passportDocument", files.passportDocument);
      }
      if (files.tenthMarksheet) {
        payload.append("tenthMarksheet", files.tenthMarksheet);
      }
      if (files.twelfthMarksheet) {
        payload.append("twelfthMarksheet", files.twelfthMarksheet);
      }
      if (files.collegeIdCard) {
        payload.append("collegeIdCard", files.collegeIdCard);
      }
      if (files.aadharCard) {
        payload.append("aadharCard", files.aadharCard);
      }
      files.semesterMarksheets.forEach((file) => {
        payload.append("semesterMarksheets", file);
      });

      const response = await fetch(`${API_BASE_URL}/students/`, {
        method: "POST",
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data === "object" ? JSON.stringify(data) : "Failed to submit form"
        );
      }

      setSubmitMessage("Form submitted successfully and stored in MongoDB.");
      alert("Form submitted successfully and stored in MongoDB.");
      console.log("Saved student:", data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error(error);
      setSubmitError(error.message || "Submission failed.");
      alert("Failed to submit form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (label, field, options = {}) => (
    <div className={`form-group ${options.fullWidth ? "full-width" : ""}`}>
      <label>{label}</label>
      {options.textarea ? (
        <textarea
          rows={options.rows || 4}
          value={options.value ?? formData[field] ?? ""}
          onChange={(event) => updateField(field, event.target.value)}
        />
      ) : (
        <input
          type={options.type || "text"}
          value={options.value ?? formData[field] ?? ""}
          disabled={options.disabled || false}
          onChange={options.onChange || ((event) => updateField(field, event.target.value))}
        />
      )}
    </div>
  );

  const renderSelect = (label, field, values, placeholder) => (
    <div className="form-group">
      <label>{label}</label>
      <select
        value={formData[field] ?? ""}
        disabled={
          (field === "department" && Boolean(currentUser?.department || profileRecord?.department)) ||
          false
        }
        onChange={(event) => updateField(field, event.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );

  const renderFileInput = (label, field, multiple = false) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple={multiple}
        onChange={multiple ? handleMultipleFileUpload : (event) => handleSingleFileUpload(field, event)}
      />
      {!!profileRecord?.documents?.[field] && !multiple && (
        <small className="portal-page-text">Existing file saved. Upload only if you want to replace it.</small>
      )}
      {!!profileRecord?.documents?.semesterMarksheets?.length && multiple && (
        <small className="portal-page-text">
          {profileRecord.documents.semesterMarksheets.length} semester marksheet file(s) already saved.
          Upload new files only if you want to replace them.
        </small>
      )}
    </div>
  );

  return (
    <div className="student-form-page">
      <h2>{profileRecord ? "Update Placement Registration" : "Placement Registration"}</h2>
      {isProfileLoading && (
        <p className="portal-page-text">Loading your saved profile details...</p>
      )}
      <ProgressBar step={step} />

      {step === 1 && (
        <div className="phase-card">
          <h3>Basic Student Information</h3>
          <div className="form-grid">
            {renderInput("Class Advisor", "classAdvisor")}
            {renderInput("First Name", "firstName")}
            {renderInput("Last Name (Initial at the back)", "lastName")}
            {renderSelect(
              "Department",
              "department",
              departmentOptions,
              "Select Department"
            )}
            {renderSelect("Degree", "degree", ["B.E", "B.Tech"], "Select Degree")}
            {renderSelect("Year", "year", ["3rd Year", "4th Year"], "Select Year")}
            {renderInput("Date of Birth", "dob", {
              type: "date",
              onChange: handleDOBChange,
            })}
            {renderInput("Age", "age", { disabled: true })}
            {renderSelect("Gender", "gender", ["Male", "Female"], "Select Gender")}
            {renderSelect(
              "Blood Group",
              "blood",
              ["A+", "B+", "AB+", "AB-", "O+", "O-"],
              "Select Blood Group"
            )}
            {renderInput("Aadhar Number", "aadhar")}
            <div className="form-group">
              <label>Passport Availability</label>
              <div className="domain-item">
                <label>
                  <input
                    type="radio"
                    name="passportAvailability"
                    value="Yes"
                    checked={formData.passportAvailability === "Yes"}
                    onChange={(event) =>
                      updateField("passportAvailability", event.target.value)
                    }
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="passportAvailability"
                    value="No"
                    checked={formData.passportAvailability === "No"}
                    onChange={(event) =>
                      updateField("passportAvailability", event.target.value)
                    }
                  />
                  No
                </label>
              </div>
            </div>
            {formData.passportAvailability === "Yes" && (
              <div className="form-group">
                <label>Upload Passport PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(event) => handleSingleFileUpload("passportDocument", event)}
                />
              </div>
            )}
          </div>

          <h4>Email Details</h4>
          <div className="form-grid">
            {renderInput("Primary Email", "primaryEmail", { type: "email" })}
            {renderInput("Secondary Email", "secondaryEmail", { type: "email" })}
          </div>

          <h4>Contact Details</h4>
          <div className="form-grid">
            {renderInput("Phone Number", "phoneNumber")}
            {renderInput("WhatsApp Number", "whatsappNumber")}
            {renderInput("Residential Address", "residentialAddress", {
              textarea: true,
              fullWidth: true,
            })}
          </div>

          <div className="form-navigation">
            <button onClick={next}>Next</button>
          </div>
        </div>
      )}

          {step === 2 && (
            <div className="phase-card">
              <h3>Languages Known</h3>
              {formData.languagesKnown.map((languageItem, index) => (
                <div className="form-grid" key={`language-${index}`}>
                  {renderInput("Known Language", "language", {
                    value: languageItem.language,
                    onChange: (event) =>
                      updateArrayItem(
                        "languagesKnown",
                        index,
                        "language",
                        event.target.value
                      ),
                  })}
                  {index > 0 ? (
                    <div className="form-group">
                      <label>Proficiency Test Level</label>
                      <select
                        value={languageItem.proficiencyTestLevel}
                        onChange={(event) =>
                          updateArrayItem(
                            "languagesKnown",
                            index,
                            "proficiencyTestLevel",
                            event.target.value
                          )
                        }
                      >
                        <option value="" disabled>
                          Select Level
                        </option>
                        <option value="Level 1">Level 1</option>
                        <option value="Level 2">Level 2</option>
                        <option value="Level 3">Level 3</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Proficiency Test Level</label>
                      <input type="text" value="Not required for first language" disabled />
                    </div>
                  )}
                  {index > 0 && (
                    <div className="full-width" style={{ marginTop: "4px" }}>
                      <button onClick={() => removeArrayItem("languagesKnown", index)}>
                        Remove Language
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="full-width" style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    addArrayItem("languagesKnown", {
                      language: "",
                      proficiencyTestLevel: "",
                    })
                  }
                >
                  + Add Language
                </button>
              </div>

              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="phase-card">
              <h3>Parent Details</h3>
              <div className="form-grid">
                {renderInput("Father's Name", "fatherName")}
                {renderInput("Mother's Name", "motherName")}
                {renderInput("Father's Mobile Number", "fatherMobileNumber")}
                {renderInput("Mother's Mobile Number", "motherMobileNumber")}
                {renderInput("Family Income", "income")}
                {renderSelect(
                  "Father Occupation",
                  "fatherOccupation",
                  ["Yes", "No"],
                  "Select"
                )}
                {renderSelect(
                  "Mother Occupation",
                  "motherOccupation",
                  ["Yes", "No"],
                  "Select"
                )}
              </div>

              {formData.fatherOccupation === "Yes" && (
                <div className="conditional-section">
                  <h4>Father Organization Details</h4>
                  <div className="form-grid">
                    {renderInput("Organization Name", "fatherOrganizationName")}
                    {renderInput(
                      "Organization Contact Number",
                      "fatherOrganizationContactNumber"
                    )}
                  </div>
                </div>
              )}

              {formData.motherOccupation === "Yes" && (
                <div className="conditional-section">
                  <h4>Mother Organization Details</h4>
                  <div className="form-grid">
                    {renderInput("Organization Name", "motherOrganizationName")}
                    {renderInput(
                      "Organization Contact Number",
                      "motherOrganizationContactNumber"
                    )}
                  </div>
                </div>
              )}

              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="phase-card">
              <h3>School Details</h3>

              <h4>10th Standard</h4>
              <div className="form-grid">
                {renderSelect("Board", "sslcBoard", boardOptions, "Select Board")}
                {renderInput("School Name", "sslcSchoolName")}
                {renderInput("Location", "sslcLocation")}
                {renderInput("Percentage", "sslcPercentage")}
                {renderInput("Year of Passing Out", "sslcYear")}
              </div>

              <h4>12th Standard (Optional if Diploma)</h4>
              <div className="form-grid">
                {renderSelect("Board", "hscBoard", boardOptions, "Select Board")}
                {renderInput("School Name", "hscSchoolName")}
                {renderInput("Location", "hscLocation")}
                {renderInput("Percentage", "hscPercentage")}
                {renderInput("Year of Passing Out", "hscYear")}
              </div>

              <h4>Diploma (if 12th not completed)</h4>
              <div className="form-grid">
                {renderInput("Diploma Specialization", "diplomaSpecialization")}
                {renderInput("Institute Name", "diplomaInstitute")}
                {renderInput("Location", "diplomaLocation")}
                {renderInput("Percentage", "diplomaPercentage")}
                {renderInput("Year of Passing Out", "diplomaYear")}
              </div>

              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="phase-card">
              <h3>College Academic Details</h3>
              <div className="form-grid">
                {renderInput("GPA in Sem1", "gpaSem1")}
                {renderInput("GPA in Sem2", "gpaSem2")}
                {renderInput("GPA in Sem3", "gpaSem3")}
                {renderInput("GPA in Sem4", "gpaSem4")}
                {renderInput("GPA in Sem5", "gpaSem5")}
                {renderInput("GPA in Sem6", "gpaSem6")}
                {renderInput("GPA in Sem7 (If Applicable)", "gpaSem7")}
                {renderInput("CGPA", "cgpa", { disabled: true })}
                {renderSelect(
                  "Current Arrears",
                  "currentArrears",
                  ["0", "1", "2", "3", "4", "5"],
                  "Select"
                )}
                {renderSelect(
                  "History Arrears",
                  "historyArrears",
                  ["0", "1", "2", "3", "4", "5"],
                  "Select"
                )}
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="phase-card">
              <h3>Skills</h3>
              <div className="form-grid">
                {renderInput("Hardware Skills", "hardwareSkills", {
                  textarea: true,
                })}
                {renderInput("Software Skills", "softwareSkills", {
                  textarea: true,
                })}
                {renderInput("Domain Skills", "domainSkills", {
                  textarea: true,
                  fullWidth: true,
                })}
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="phase-card">
              <h3>Projects</h3>
              {formData.projects.map((project, index) => (
                <div className="form-grid" key={`project-${index}`}>
                  {renderInput("Title", "title", {
                    value: project.title,
                    onChange: (event) =>
                      updateArrayItem("projects", index, "title", event.target.value),
                  })}
                  {renderInput("Technology", "technology", {
                    value: project.technology,
                    onChange: (event) =>
                      updateArrayItem("projects", index, "technology", event.target.value),
                  })}
                  {renderInput("Description", "description", {
                    value: project.description,
                    onChange: (event) =>
                      updateArrayItem("projects", index, "description", event.target.value),
                  })}
                </div>
              ))}
              <div className="full-width" style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    addArrayItem("projects", {
                      title: "",
                      technology: "",
                      description: "",
                    })
                  }
                >
                  + Add Project
                </button>
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="phase-card">
              <h3>Internships</h3>
              {formData.internships.map((internship, index) => (
                <div className="form-grid" key={`intern-${index}`}>
                  {renderInput("Company", "company", {
                    value: internship.company,
                    onChange: (event) =>
                      updateArrayItem("internships", index, "company", event.target.value),
                  })}
                  {renderInput("Role", "role", {
                    value: internship.role,
                    onChange: (event) =>
                      updateArrayItem("internships", index, "role", event.target.value),
                  })}
                  {renderInput("Duration", "duration", {
                    value: internship.duration,
                    onChange: (event) =>
                      updateArrayItem("internships", index, "duration", event.target.value),
                  })}
                </div>
              ))}
              <div className="full-width" style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    addArrayItem("internships", {
                      company: "",
                      role: "",
                      duration: "",
                    })
                  }
                >
                  + Add Internship
                </button>
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="phase-card">
              <h3>Certifications</h3>
              {formData.certifications.map((certification, index) => (
                <div className="form-grid" key={`cert-${index}`}>
                  {renderInput("Certification", "certification", {
                    value: certification.certification,
                    onChange: (event) =>
                      updateArrayItem(
                        "certifications",
                        index,
                        "certification",
                        event.target.value
                      ),
                  })}
                  {renderInput("Platform", "platform", {
                    value: certification.platform,
                    onChange: (event) =>
                      updateArrayItem(
                        "certifications",
                        index,
                        "platform",
                        event.target.value
                      ),
                  })}
                  {renderInput("Credential ID", "credentialId", {
                    value: certification.credentialId,
                    onChange: (event) =>
                      updateArrayItem(
                        "certifications",
                        index,
                        "credentialId",
                        event.target.value
                      ),
                  })}
                </div>
              ))}
              <div className="full-width" style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    addArrayItem("certifications", {
                      certification: "",
                      platform: "",
                      credentialId: "",
                    })
                  }
                >
                  + Add Certification
                </button>
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="phase-card">
              <h3>Phase 9: Placement Details</h3>

              <div className="form-grid">
                {renderSelect(
                  "Participate in placement drive?",
                  "participatePlacement",
                  ["Yes", "No"],
                  "Select"
                )}
                {renderSelect(
                  "If No Reason",
                  "noReason",
                  ["Higher Studies", "Government Jobs", "Entrepreneur"],
                  "Select"
                )}
                {renderSelect(
                  "Company Specific Training?",
                  "companyTraining",
                  ["Yes", "No"],
                  "Select"
                )}
                {renderSelect(
                  "Agency Training?",
                  "agencyTraining",
                  ["Yes", "No"],
                  "Select"
                )}
                {renderSelect(
                  "Eligibility",
                  "eligibility",
                  ["Eligible", "Not Eligible"],
                  "Select"
                )}
              </div>

              <h4>Interested Domain</h4>
              <div className="domain-options">
                {interestedDomainOptions.map((domain) => (
                  <label key={domain} className="domain-item">
                    <input
                      type="checkbox"
                      checked={formData.interestedDomains.includes(domain)}
                      onChange={(event) => handleDomainChange(domain, event.target.checked)}
                    />
                    {domain}
                  </label>
                ))}
              </div>

              {renderInput("Other Details", "otherDetails", {
                textarea: true,
                fullWidth: true,
              })}

              <div className="form-navigation" style={{ marginTop: "15px" }}>
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 11 && (
            <div className="phase-card">
              <h3>Documents</h3>
              <div className="form-grid">
                {renderFileInput("10th Marksheet", "tenthMarksheet")}
                {renderFileInput("12th Marksheet", "twelfthMarksheet")}
                {renderFileInput("College ID Card", "collegeIdCard")}
                {renderFileInput("Aadhar Card", "aadharCard")}
                {renderFileInput("All Semester Marksheets", "semesterMarksheets", true)}
              </div>
              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === 12 && (
            <div className="phase-card">
              <h3>Declaration</h3>

              <div
                style={{
                  marginBottom: "15px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  background: "#ffffff",
                }}
              >
                <div className="form-grid">
                  {renderInput("Student Name", "firstName")}
                  {renderInput("University Reg No", "regno", {
                    disabled: Boolean(currentUser?.username || profileRecord?.regno),
                  })}
                  {renderInput("Batch", "batch")}
                  {renderInput("Department", "department", {
                    disabled: Boolean(currentUser?.department || profileRecord?.department),
                  })}
                </div>
              </div>

              <div
                style={{
                  maxHeight: "250px",
                  overflowY: "scroll",
                  padding: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  background: "#f9f9f9",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginBottom: "15px",
                }}
              >
                <p>I hereby undertake with my full knowledge that:</p>
                <ul>
                  <li>
                    I shall be present for all Internal (core subject training, Mock GD,
                    Technical & HR Interview) and External (Aptitude, Programming,
                    Contest-based training, Company specific training), Soft Skill
                    training, Foreign Language training & Communication training if
                    enrolled as a part of placement process.
                  </li>
                  <li>
                    I shall be allowed to appear for the company placement drives only if
                    I have 100% attendance in training sessions. If my attendance falls
                    below 90%, I shall abide by actions taken by authorities.
                  </li>
                  <li>
                    I shall attend the Pre-Placement Talks organized by
                    Employers/Organizations.
                  </li>
                  <li>
                    I shall not remain absent during Training / Placement Drives without
                    permission from the Training & Placement Officer.
                  </li>
                  <li>
                    Once selected, I shall follow the terms of the offer letter and the
                    T&P Office is not responsible for any consequences.
                  </li>
                  <li>
                    I shall be ready to sign a contract or bond if required by the
                    employer.
                  </li>
                </ul>
              </div>

              <h4>Placement Preference</h4>
              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    name="placement"
                    value="Tamil Nadu"
                    checked={formData.placement === "Tamil Nadu"}
                    onChange={(event) => updateField("placement", event.target.value)}
                  />
                  Within Tamil Nadu
                </label>
                <label>
                  <input
                    type="radio"
                    name="placement"
                    value="PAN India"
                    checked={formData.placement === "PAN India"}
                    onChange={(event) => updateField("placement", event.target.value)}
                  />
                  PAN India
                </label>
                <label>
                  <input
                    type="radio"
                    name="placement"
                    value="Overseas"
                    checked={formData.placement === "Overseas"}
                    onChange={(event) => updateField("placement", event.target.value)}
                  />
                  Overseas
                </label>
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.declarationAgreed}
                    onChange={(event) =>
                      updateField("declarationAgreed", event.target.checked)
                    }
                  />
                  I have read and agree to the above declaration
                </label>
              </div>

              <div className="form-navigation">
                <button onClick={back}>Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : profileRecord ? "Update Profile" : "Submit"}
                </button>
              </div>

              {submitMessage && (
                <p style={{ color: "green", marginTop: "10px" }}>{submitMessage}</p>
              )}
              {submitError && (
                <p style={{ color: "red", marginTop: "10px" }}>{submitError}</p>
              )}
            </div>
          )}
    </div>
  );
}

export default StudentForm;
