import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase


class StudentApiTests(APITestCase):
    def test_health_check(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_dashboard_overview(self):
        response = self.client.get("/api/dashboard/overview/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("star_students", payload)
        self.assertIn("department_placement_stats", payload)
        self.assertIn("gender_totals", payload)

    def test_admin_dashboard_overview(self):
        response = self.client.get("/api/dashboard/admin/overview/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("kpis", payload)
        self.assertIn("students", payload)
        self.assertIn("companies", payload)
        self.assertIn("drives", payload)

    def test_department_dashboard_overview(self):
        response = self.client.get("/api/dashboard/department/overview/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("kpis", payload)
        self.assertIn("department_stats", payload)

    def test_portal_content_endpoints(self):
        placement_response = self.client.get("/api/portal/placement-details/")
        internship_response = self.client.get("/api/portal/internships/")
        hiring_response = self.client.get("/api/portal/hirings/")
        contact_response = self.client.get("/api/portal/contact/")

        self.assertEqual(placement_response.status_code, 200)
        self.assertEqual(internship_response.status_code, 200)
        self.assertEqual(hiring_response.status_code, 200)
        self.assertEqual(contact_response.status_code, 200)

    @patch("apps.students.views.create_student")
    @patch("apps.students.views.save_uploaded_file")
    @patch("apps.students.views.validate_uploaded_file")
    def test_create_student(
        self, mock_validate_uploaded_file, mock_save_uploaded_file, mock_create_student
    ):
        mock_validate_uploaded_file.return_value = None
        mock_save_uploaded_file.return_value = "/media/student_uploads/test/file.pdf"
        mock_create_student.return_value = {
            "id": "abc123",
            "classAdvisor": "Mrs. Meena",
            "firstName": "Nithya",
            "lastName": "S",
            "regno": "RIT2026001",
            "department": "CSE",
            "primaryEmail": "nithya@example.com",
            "created_at": "2026-03-23T10:00:00+00:00",
        }

        form_payload = {
            "classAdvisor": "Mrs. Meena",
            "firstName": "Nithya",
            "lastName": "S",
            "department": "CSE",
            "degree": "B.E",
            "year": "4th",
            "passportAvailability": "Yes",
            "languagesKnown": [
                {"language": "English", "proficiencyTestLevel": ""},
                {"language": "Tamil", "proficiencyTestLevel": "Level 2"},
            ],
            "primaryEmail": "nithya@example.com",
            "secondaryEmail": "nithya.secondary@example.com",
            "phoneNumber": "9876543210",
            "whatsappNumber": "9876543210",
            "residentialAddress": "Rajapalayam",
            "fatherName": "Father",
            "motherName": "Mother",
            "fatherMobileNumber": "9876543211",
            "motherMobileNumber": "9876543212",
            "income": "500000",
            "fatherOccupation": "No",
            "motherOccupation": "No",
            "regno": "RIT2026001",
            "sslcBoard": "CBSE",
            "sslcSchoolName": "ABC School",
            "sslcLocation": "Rajapalayam",
            "sslcRegisterNo": "123",
            "sslcPercentage": "95",
            "sslcYear": "2020",
            "hscBoard": "STATE BOARD",
            "hscSchoolName": "XYZ School",
            "hscLocation": "Rajapalayam",
            "hscRegisterNo": "456",
            "hscPercentage": "92",
            "hscYear": "2022",
            "currentArrears": "0",
            "historyArrears": "0",
            "eligibility": "Eligible",
            "hardwareSkills": "Embedded systems",
            "softwareSkills": "Python, React",
            "domainSkills": "Placement coordination",
            "projects": [{"title": "Portal", "technology": "React", "description": "App"}],
            "internships": [{"company": "ABC", "role": "Intern", "duration": "2 months"}],
            "certifications": [{"certification": "AWS", "platform": "Coursera", "credentialId": "123"}],
            "placement": "PAN India",
            "declarationAgreed": True,
        }

        payload = {
            "form_payload": json.dumps(form_payload),
            "passportDocument": SimpleUploadedFile(
                "passport.pdf", b"fake-pdf-content", content_type="application/pdf"
            ),
            "tenthMarksheet": SimpleUploadedFile(
                "tenth.pdf", b"fake-pdf-content", content_type="application/pdf"
            ),
            "twelfthMarksheet": SimpleUploadedFile(
                "twelfth.pdf", b"fake-pdf-content", content_type="application/pdf"
            ),
            "collegeIdCard": SimpleUploadedFile(
                "college-id.pdf", b"fake-pdf-content", content_type="application/pdf"
            ),
            "aadharCard": SimpleUploadedFile(
                "aadhar.pdf", b"fake-pdf-content", content_type="application/pdf"
            ),
            "semesterMarksheets": [
                SimpleUploadedFile(
                    "semester-1.pdf", b"fake-pdf-content", content_type="application/pdf"
                )
            ],
        }

        response = self.client.post("/api/students/", payload, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["regno"], form_payload["regno"])
