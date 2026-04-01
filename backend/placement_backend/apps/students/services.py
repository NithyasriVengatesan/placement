from collections import defaultdict
from datetime import datetime, timezone

from pymongo.errors import PyMongoError

from .mongodb import (
    get_application_collection,
    get_company_collection,
    get_department_placement_collection,
    get_drive_collection,
    get_hiring_collection,
    get_internship_collection,
    get_portal_content_collection,
    get_star_students_collection,
    get_student_collection,
)


def _serialize_student(document):
    serialized = dict(document)
    serialized["id"] = str(serialized.pop("_id"))
    if "created_at" in serialized and serialized["created_at"] is not None:
        serialized["created_at"] = serialized["created_at"].isoformat()
    return serialized


def create_student(payload):
    collection = get_student_collection()
    document = {
        **payload,
        "created_at": datetime.now(timezone.utc),
    }
    result = collection.insert_one(document)
    created_document = collection.find_one({"_id": result.inserted_id})
    return _serialize_student(created_document)


def list_students():
    try:
        collection = get_student_collection()
        students = collection.find().sort("created_at", -1)
        return [_serialize_student(student) for student in students]
    except PyMongoError:
        return []


def _safe_float(value):
    if value in (None, ""):
        return None

    try:
        return float(str(value).replace("%", "").strip())
    except (TypeError, ValueError):
        return None


def _safe_package_value(value):
    if value in (None, ""):
        return None

    cleaned = "".join(
        character for character in str(value) if character.isdigit() or character == "."
    )
    if not cleaned:
        return None

    try:
        return float(cleaned)
    except ValueError:
        return None


def _student_name(student):
    full_name = " ".join(
        part for part in [student.get("firstName"), student.get("lastName")] if part
    ).strip()
    return full_name or student.get("name") or student.get("regno") or "Student"


def _student_cgpa(student):
    return _safe_float(student.get("cgpa") or student.get("overallCGPA"))


def _student_is_eligible(student):
    explicit_eligibility = str(student.get("eligibility", "")).strip().lower()
    if explicit_eligibility == "eligible":
        return True
    if explicit_eligibility == "not eligible":
        return False

    cgpa = _student_cgpa(student)
    has_no_current_arrears = str(student.get("currentArrears", "")).strip() in {
        "",
        "0",
        "Nil",
    }
    profile_approved = bool(student.get("declarationAgreed"))
    return profile_approved and has_no_current_arrears and (cgpa is None or cgpa >= 6.0)


def _student_status(student):
    if student.get("placementStatus"):
        return student["placementStatus"]
    if student.get("placedCompany"):
        return "Placed"
    if student.get("declarationAgreed"):
        return "Profile Submitted"
    return "Pending"


def _student_company(student):
    return student.get("placedCompany") or student.get("companyTraining") or "-"


def _fetch_collection_records(get_collection, default_records, sort_field=None):
    try:
        collection = get_collection()
        cursor = collection.find({}, {"_id": 0})
        if sort_field:
            cursor = cursor.sort(sort_field, 1)
        records = list(cursor)
        return records or default_records
    except PyMongoError:
        return default_records


DEFAULT_PLACEMENT_DETAILS = {
    "title": "Placement Details",
    "intro": "Explore the placement process, eligibility expectations, preparation flow, and final recruitment support available for students.",
    "sections": [
        {
            "title": "Placement Process",
            "points": [
                "Student profile submission and document verification",
                "Eligibility validation based on academics and arrears",
                "Company-specific registration and shortlist publication",
                "Online test, technical rounds, HR rounds, and offer release",
            ],
        },
        {
            "title": "Student Preparation",
            "points": [
                "Aptitude training and coding practice support",
                "Resume review and interview preparation guidance",
                "Department-wise tracking of ready-to-apply students",
            ],
        },
        {
            "title": "Placement Support",
            "points": [
                "Centralized company and drive updates",
                "Application monitoring with placement cell coordination",
                "Post-offer follow-up and reporting",
            ],
        },
    ],
}


DEFAULT_INTERNSHIPS = [
    {
        "name": "Zoho",
        "role": "Software Developer Intern",
        "mode": "On-site",
        "location": "Chennai",
        "duration": "6 Months",
        "stipend": "Based on interview performance",
        "summary": "Strong opportunity for students interested in product engineering, web development, and problem solving.",
    },
    {
        "name": "TCS",
        "role": "Industry Internship Program",
        "mode": "Hybrid",
        "location": "Bengaluru",
        "duration": "8 Weeks",
        "stipend": "Certificate based program",
        "summary": "Exposure to enterprise workflows, project teams, and real-time delivery practices for final-year students.",
    },
    {
        "name": "Infosys",
        "role": "Technical Internship",
        "mode": "Remote",
        "location": "Virtual",
        "duration": "10 Weeks",
        "stipend": "Performance based",
        "summary": "Internship focused on software foundations, communication, and collaborative project execution.",
    },
]


DEFAULT_HIRINGS = [
    {
        "company": "TCS",
        "role": "Assistant System Engineer",
        "package": "3.6 LPA",
        "location": "Chennai",
        "mode": "Hybrid",
        "deadline": "2026-04-12",
        "departments": ["CSE", "IT", "ECE", "AIML"],
    },
    {
        "company": "Zoho",
        "role": "Software Developer",
        "package": "7.2 LPA",
        "location": "Chennai",
        "mode": "On-site",
        "deadline": "2026-04-18",
        "departments": ["CSE", "IT", "AIML", "AIDS"],
    },
    {
        "company": "Infosys",
        "role": "Systems Engineer",
        "package": "4.1 LPA",
        "location": "Bengaluru",
        "mode": "Hybrid",
        "deadline": "2026-04-22",
        "departments": ["CSE", "IT", "ECE", "EEE"],
    },
]


DEFAULT_CONTACT_DETAILS = {
    "title": "Placement Cell Contact",
    "intro": "Reach the placement cell for drive clarification, profile support, and student coordination updates.",
    "primary_contact": {
        "name": "Placement Cell Office",
        "phone": "+91 4563 123456",
        "email": "placementcell@ritrjpm.ac.in",
    },
    "office_hours": "Monday to Friday, 9:00 AM to 4:30 PM",
    "address": "Ramco Institute of Technology, Rajapalayam, Tamil Nadu",
    "contacts": [
        {
            "title": "Student Support",
            "detail": "Document issues, registration status, and application queries",
        },
        {
            "title": "Company Coordination",
            "detail": "Drive scheduling, recruitment partnerships, and visit planning",
        },
        {
            "title": "Department Coordination",
            "detail": "Eligibility validation and department-level placement follow-up",
        },
    ],
}


DEFAULT_COMPANIES = [
    {"name": "Zoho", "industry": "Product Engineering", "status": "Active"},
    {"name": "TCS", "industry": "IT Services", "status": "Active"},
    {"name": "Infosys", "industry": "Technology Services", "status": "Active"},
    {"name": "Wipro", "industry": "Consulting", "status": "Visited"},
]


DEFAULT_DRIVES = [
    {
        "company": "Zoho",
        "role": "Software Developer",
        "deadline": "2026-04-18",
        "status": "Active",
        "departments": ["CSE", "IT", "AIML"],
        "minCgpa": "7.0",
        "applicants": 86,
    },
    {
        "company": "Infosys",
        "role": "Systems Engineer",
        "deadline": "2026-04-22",
        "status": "Upcoming",
        "departments": ["CSE", "IT", "ECE", "EEE"],
        "minCgpa": "6.5",
        "applicants": 112,
    },
    {
        "company": "TCS",
        "role": "ASE",
        "deadline": "2026-04-12",
        "status": "Completed",
        "departments": ["CSE", "IT", "ECE", "AIML"],
        "minCgpa": "6.0",
        "applicants": 124,
    },
]


DEFAULT_APPLICATIONS = [
    {
        "student_regno": "RIT2026001",
        "student_name": "Nithya S",
        "company": "Zoho",
        "status": "Selected",
        "date": "2026-03-28",
    },
    {
        "student_regno": "RIT2026014",
        "student_name": "Harish K",
        "company": "Infosys",
        "status": "Interviewed",
        "date": "2026-03-30",
    },
    {
        "student_regno": "RIT2026032",
        "student_name": "Keerthana P",
        "company": "TCS",
        "status": "Applied",
        "date": "2026-03-31",
    },
]


DEFAULT_ACTIVITY_LOGS = [
    "Admin created a new drive for Zoho",
    "Result uploaded for TCS shortlist round",
    "Department coordinator approved 24 student profiles",
    "Company contact details updated for Infosys",
]


DEFAULT_REPORTS = [
    "Placed students report",
    "Company visit report",
    "Department-wise eligibility report",
    "Offer release summary",
]


DEFAULT_ANNOUNCEMENTS = [
    "Zoho drive registration closes on 18 April 2026",
    "Resume verification for final year students is open this week",
    "Department coordinators must verify pending student profiles",
]


DEFAULT_STAR_STUDENTS = [
    {
        "name": "Aarthi M",
        "student_id": "RIT24CSE001",
        "marks": 1185,
        "percent": 98,
        "year": "2026",
        "avatar": "",
    },
    {
        "name": "Diana Plenty",
        "student_id": "RIT24ECE014",
        "marks": 1165,
        "percent": 91,
        "year": "2026",
        "avatar": "",
    },
    {
        "name": "John Millar",
        "student_id": "RIT24EEE017",
        "marks": 1175,
        "percent": 92,
        "year": "2026",
        "avatar": "",
    },
    {
        "name": "Miles Esther",
        "student_id": "RIT24AIML031",
        "marks": 1180,
        "percent": 93,
        "year": "2026",
        "avatar": "",
    },
]


DEFAULT_DEPARTMENT_PLACEMENT_STATS = [
    {"department": "CSE", "male": 42, "female": 36},
    {"department": "CSE(AI & ML)", "male": 28, "female": 24},
    {"department": "AIDS", "male": 24, "female": 26},
    {"department": "IT", "male": 31, "female": 29},
    {"department": "CSBS", "male": 18, "female": 21},
    {"department": "ECE", "male": 26, "female": 19},
    {"department": "EEE", "male": 22, "female": 15},
    {"department": "MECH", "male": 34, "female": 8},
    {"department": "CIVIL", "male": 16, "female": 7},
]


def list_star_students():
    try:
        collection = get_star_students_collection()
        records = list(collection.find({}, {"_id": 0}).sort("percent", -1))
        return records or DEFAULT_STAR_STUDENTS
    except PyMongoError:
        return DEFAULT_STAR_STUDENTS


def create_star_student(payload):
    try:
        collection = get_star_students_collection()
        document = {
            **payload,
            "created_at": datetime.now(timezone.utc),
        }
        collection.insert_one(document)
        return {key: value for key, value in document.items() if key != "created_at"}
    except PyMongoError:
        return payload


def list_department_placement_stats():
    try:
        collection = get_department_placement_collection()
        records = list(collection.find({}, {"_id": 0}).sort("department", 1))
        return records or DEFAULT_DEPARTMENT_PLACEMENT_STATS
    except PyMongoError:
        return DEFAULT_DEPARTMENT_PLACEMENT_STATS


def create_department_placement_stat(payload):
    try:
        collection = get_department_placement_collection()
        document = {
            **payload,
            "created_at": datetime.now(timezone.utc),
        }
        collection.insert_one(document)
        return {key: value for key, value in document.items() if key != "created_at"}
    except PyMongoError:
        return payload


def get_dashboard_overview():
    star_students = list_star_students()
    department_stats = list_department_placement_stats()
    total_male = sum(item["male"] for item in department_stats)
    total_female = sum(item["female"] for item in department_stats)

    return {
        "star_students": star_students,
        "department_placement_stats": department_stats,
        "gender_totals": {
            "male": total_male,
            "female": total_female,
            "total": total_male + total_female,
        },
    }


def get_placement_details_content():
    try:
        collection = get_portal_content_collection()
        record = collection.find_one({"key": "placement_details"}, {"_id": 0, "key": 0})
        return record or DEFAULT_PLACEMENT_DETAILS
    except PyMongoError:
        return DEFAULT_PLACEMENT_DETAILS


def list_internships():
    return _fetch_collection_records(
        get_internship_collection,
        DEFAULT_INTERNSHIPS,
        sort_field="name",
    )


def list_hirings():
    return _fetch_collection_records(
        get_hiring_collection,
        DEFAULT_HIRINGS,
        sort_field="company",
    )


def get_contact_details():
    try:
        collection = get_portal_content_collection()
        record = collection.find_one({"key": "contact_details"}, {"_id": 0, "key": 0})
        return record or DEFAULT_CONTACT_DETAILS
    except PyMongoError:
        return DEFAULT_CONTACT_DETAILS


def list_companies():
    return _fetch_collection_records(
        get_company_collection,
        DEFAULT_COMPANIES,
        sort_field="name",
    )


def list_drives():
    return _fetch_collection_records(
        get_drive_collection,
        DEFAULT_DRIVES,
        sort_field="deadline",
    )


def list_applications():
    return _fetch_collection_records(
        get_application_collection,
        DEFAULT_APPLICATIONS,
        sort_field="date",
    )


def _build_department_student_stats(students):
    department_stats = defaultdict(
        lambda: {"department": "", "total_students": 0, "eligible_students": 0, "placed_students": 0}
    )

    for student in students:
        department = student.get("department") or "Unknown"
        entry = department_stats[department]
        entry["department"] = department
        entry["total_students"] += 1
        if _student_is_eligible(student):
            entry["eligible_students"] += 1
        if _student_status(student).lower() == "placed":
            entry["placed_students"] += 1

    if department_stats:
        return sorted(department_stats.values(), key=lambda item: item["department"])

    fallback = []
    for item in list_department_placement_stats():
        fallback.append(
            {
                "department": item["department"],
                "total_students": item["male"] + item["female"],
                "eligible_students": item["male"] + item["female"],
                "placed_students": item["male"] + item["female"],
            }
        )
    return fallback


def get_admin_dashboard_overview():
    students = list_students()
    drives = list_drives()
    companies = list_companies()
    applications = list_applications()
    hirings = list_hirings()

    total_students = len(students)
    eligible_students = sum(1 for student in students if _student_is_eligible(student))

    selected_applications = [
        application
        for application in applications
        if str(application.get("status", "")).lower() == "selected"
    ]
    placed_students = len(selected_applications)
    if placed_students == 0:
        placed_students = sum(1 for student in students if _student_status(student).lower() == "placed")

    active_drives = [
        drive
        for drive in drives
        if str(drive.get("status", "")).lower() in {"active", "upcoming", "ongoing"}
    ]
    packages = [
        _safe_package_value(item.get("package") or item.get("salary_package"))
        for item in hirings + drives
    ]
    packages = [value for value in packages if value is not None]
    placement_percentage = round((placed_students / total_students) * 100, 1) if total_students else 0

    student_rows = []
    for student in students[:12]:
        student_rows.append(
            {
                "name": _student_name(student),
                "regno": student.get("regno", "-"),
                "department": student.get("department", "-"),
                "cgpa": student.get("cgpa") or student.get("overallCGPA") or "-",
                "eligibility": "Eligible" if _student_is_eligible(student) else "Not Eligible",
                "status": _student_status(student),
                "company": _student_company(student),
            }
        )

    if not student_rows:
        student_rows = [
            {
                "name": application["student_name"],
                "regno": application["student_regno"],
                "department": "Pending",
                "cgpa": "-",
                "eligibility": "Pending",
                "status": application["status"],
                "company": application["company"],
            }
            for application in applications[:8]
        ]

    return {
        "kpis": [
            {"label": "Total Students", "value": total_students},
            {"label": "Eligible Students", "value": eligible_students},
            {"label": "Placed Students", "value": placed_students},
            {"label": "Companies Visited", "value": len(companies)},
            {"label": "Active Drives", "value": len(active_drives)},
            {"label": "Placement Percentage", "value": f"{placement_percentage}%"},
            {"label": "Highest Package", "value": f"{max(packages):.1f} LPA" if packages else "0 LPA"},
            {
                "label": "Average Package",
                "value": f"{(sum(packages) / len(packages)):.1f} LPA" if packages else "0 LPA",
            },
        ],
        "quick_actions": [
            "Add Company",
            "Create Drive",
            "Add Student",
            "Publish Result",
            "Send Announcement",
        ],
        "management_sections": [
            {
                "title": "Student Management",
                "description": "Review submitted student profiles, eligibility, academic records, and profile approvals.",
                "actions": ["View all students", "Filter by department", "Approve profile", "Mark placed"],
            },
            {
                "title": "Company Management",
                "description": f"Track {len(companies)} companies, offered roles, packages, and recruitment status.",
                "actions": ["Add company", "Edit company", "Open drive", "Close drive"],
            },
            {
                "title": "Placement Drives",
                "description": f"Monitor {len(drives)} drives with deadlines, departments, and applicant readiness.",
                "actions": ["Create drive", "Approve applicants", "Reject applicants", "Publish results"],
            },
            {
                "title": "Applications Management",
                "description": f"Track {len(applications)} applications from applied to selected stages.",
                "actions": ["Approve application", "Reject application", "Move to next round", "Upload result list"],
            },
        ],
        "students": student_rows,
        "companies": companies[:8],
        "drives": drives[:8],
        "applications": sorted(applications, key=lambda item: item.get("date", ""), reverse=True)[:8],
        "projections": [
            {
                "title": "Analytics",
                "items": [
                    "Department wise placements",
                    "Company wise hiring",
                    "Package distribution",
                    "Year wise trends",
                    "Student eligibility stats",
                ],
            },
            {"title": "Reports", "items": DEFAULT_REPORTS},
            {"title": "Activity Logs", "items": DEFAULT_ACTIVITY_LOGS},
        ],
        "announcements": DEFAULT_ANNOUNCEMENTS,
        "department_stats": _build_department_student_stats(students),
    }


def get_department_dashboard_overview():
    students = list_students()
    department_stats = _build_department_student_stats(students)
    total_students = sum(item["total_students"] for item in department_stats)
    eligible_students = sum(item["eligible_students"] for item in department_stats)
    placed_students = sum(item["placed_students"] for item in department_stats)
    placement_percentage = round((placed_students / total_students) * 100, 1) if total_students else 0

    return {
        "kpis": [
            {"label": "Total Students", "value": total_students},
            {"label": "Eligible Students", "value": eligible_students},
            {"label": "Placed Students", "value": placed_students},
            {"label": "Placement Percentage", "value": f"{placement_percentage}%"},
        ],
        "department_stats": department_stats,
        "follow_up_points": [
            "Verify student profiles with missing academic or document details",
            "Track eligible students and coordinate preparation support",
            "Monitor placed students and pending high-potential candidates",
        ],
    }
