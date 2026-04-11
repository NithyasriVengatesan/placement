import xml.etree.ElementTree as ET
from collections import defaultdict
import csv
from datetime import datetime, timezone
from io import BytesIO, StringIO
from pathlib import Path
from zipfile import ZipFile

from bson import ObjectId
from pymongo.errors import PyMongoError

from .mongodb import (
    get_application_collection,
    get_company_collection,
    get_department_placement_collection,
    get_drive_collection,
    get_faculty_account_collection,
    get_faculty_schedule_collection,
    get_hiring_collection,
    get_internship_collection,
    get_portal_content_collection,
    get_star_students_collection,
    get_student_account_collection,
    get_student_collection,
)

EXCEL_NS = {"sheet": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

DEFAULT_FACULTY_ACCOUNTS = [
    {
        "employeeId": "1010",
        "name": "P.Pushpa",
        "department": "CSE",
        "roles": ["faculty"],
        "position": "HOD",
        "degree": "",
        "isHod": True,
        "mentor": False,
        "className": "",
        "section": "",
        "profilePhoto": "",
    },
    {
        "employeeId": "1011",
        "name": "M.Venkat",
        "department": "CSE",
        "roles": ["faculty"],
        "position": "Associate Professor - I",
        "degree": "",
        "isHod": False,
        "mentor": False,
        "className": "",
        "section": "",
        "profilePhoto": "",
    },
    {
        "employeeId": "1012",
        "name": "K.Nithya",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Associate Professor - II",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "I CSE",
        "section": "A",
        "profilePhoto": "",
    },
    {
        "employeeId": "1013",
        "name": "G.Sharmi",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Assistant Professor -I",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "I CSE",
        "section": "B",
        "profilePhoto": "",
    },
    {
        "employeeId": "1014",
        "name": "S.Siva",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Assistant Professor -II",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "I CSE",
        "section": "C",
        "profilePhoto": "",
    },
    {
        "employeeId": "1015",
        "name": "M.Shanjay",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Assistant Professor -III",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "",
        "section": "",
        "profilePhoto": "",
    },
    {
        "employeeId": "1016",
        "name": "S.Neyathi",
        "department": "CSE",
        "roles": ["faculty"],
        "position": "Assistant Professor -IV",
        "degree": "",
        "isHod": False,
        "mentor": False,
        "className": "",
        "section": "",
        "profilePhoto": "",
    },
    {
        "employeeId": "1017",
        "name": "P.Janani",
        "department": "CSE",
        "roles": ["faculty"],
        "position": "Professor",
        "degree": "",
        "isHod": False,
        "mentor": False,
        "className": "",
        "section": "",
        "profilePhoto": "",
    },
    {
        "employeeId": "1018",
        "name": "P.Ruthra",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Professor",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "II CSE",
        "section": "A",
        "profilePhoto": "",
    },
    {
        "employeeId": "1019",
        "name": "M.Madhu",
        "department": "CSE",
        "roles": ["faculty", "mentor"],
        "position": "Professor",
        "degree": "",
        "isHod": False,
        "mentor": True,
        "className": "II CSE",
        "section": "B",
        "profilePhoto": "",
    },
]


def _default_faculty_records_for_department(department=None):
    normalized_department = _normalize_department_value(department)
    matching_accounts = [
        account
        for account in DEFAULT_FACULTY_ACCOUNTS
        if not normalized_department
        or _normalize_department_value(account.get("department", "")) == normalized_department
    ]

    return [
        {
            "id": f"default-{account['employeeId']}",
            "name": account.get("name", ""),
            "degree": account.get("degree", ""),
            "position": account.get("position", ""),
            "department": account.get("department", ""),
            "employeeId": account.get("employeeId", ""),
            "fac_username": account.get("employeeId", ""),
            "roles": _normalize_faculty_roles(account.get("roles")),
            "must_change_password": True,
            "isHod": bool(account.get("isHod")),
            "mentor": bool(account.get("mentor")),
            "className": account.get("className", ""),
            "section": account.get("section", ""),
            "profilePhoto": account.get("profilePhoto", ""),
        }
        for account in matching_accounts
    ]


def _default_faculty_account_by_username(username):
    normalized_username = _normalize_faculty_username(username)
    for account in DEFAULT_FACULTY_ACCOUNTS:
        if _normalize_faculty_username(account.get("employeeId")) == normalized_username:
            return {
                "name": account.get("name", ""),
                "degree": account.get("degree", ""),
                "position": account.get("position", ""),
                "department": account.get("department", ""),
                "employeeId": normalized_username,
                "fac_username": normalized_username,
                "roles": _normalize_faculty_roles(account.get("roles")),
                "password": "1234",
                "must_change_password": True,
                "isHod": bool(account.get("isHod")),
                "mentor": bool(account.get("mentor")),
                "className": account.get("className", ""),
                "section": account.get("section", ""),
                "profilePhoto": account.get("profilePhoto", ""),
            }
    return None


def _upsert_faculty_account_document(account, password=None, must_change_password=None):
    collection = get_faculty_account_collection()
    username = _normalize_faculty_username(account.get("employeeId") or account.get("fac_username"))
    existing_account = collection.find_one({"fac_username": username})
    timestamp = datetime.now(timezone.utc)

    document = {
        "name": str(account.get("name", "")).strip(),
        "degree": str(account.get("degree", "")).strip(),
        "position": str(account.get("position", "")).strip(),
        "department": str(account.get("department", "")).strip(),
        "employeeId": username,
        "fac_username": username,
        "roles": _normalize_faculty_roles(account.get("roles")),
        "isHod": bool(account.get("isHod")),
        "mentor": bool(account.get("mentor")),
        "className": str(account.get("className", "")).strip(),
        "section": str(account.get("section", "")).strip(),
        "profilePhoto": str(account.get("profilePhoto", "")).strip(),
        "password": password if password is not None else account.get("password", "1234"),
        "must_change_password": (
            must_change_password
            if must_change_password is not None
            else bool(account.get("must_change_password", True))
        ),
        "updated_at": timestamp,
    }

    if existing_account:
        collection.update_one(
            {"_id": existing_account["_id"]},
            {"$set": document},
        )
        return collection.find_one({"_id": existing_account["_id"]})

    document["created_at"] = timestamp
    result = collection.insert_one(document)
    return collection.find_one({"_id": result.inserted_id})


def _merge_faculty_records(primary_records, fallback_records):
    merged_records = {}

    for record in fallback_records:
        key = _normalize_faculty_username(record.get("employeeId") or record.get("fac_username"))
        if not key:
            continue
        merged_records[key] = dict(record)

    for record in primary_records:
        key = _normalize_faculty_username(record.get("employeeId") or record.get("fac_username"))
        if not key:
            continue
        merged_records[key] = {
            **merged_records.get(key, {}),
            **record,
            "employeeId": record.get("employeeId") or merged_records.get(key, {}).get("employeeId") or key,
            "fac_username": record.get("fac_username") or merged_records.get(key, {}).get("fac_username") or key,
        }

    return list(merged_records.values())


def _normalize_faculty_username(value):
    return str(value or "").strip().upper()


def _normalize_department_value(value):
    return "".join(str(value or "").upper().split())


def _normalize_faculty_roles(values):
    normalized_roles = []
    source_values = values if isinstance(values, (list, tuple, set)) else [values]

    for value in source_values:
        for token in str(value or "").replace("/", ",").split(","):
            normalized = token.strip().lower()
            if normalized not in {"faculty", "mentor", "class_advisor", "coordinator"}:
                continue
            if normalized not in normalized_roles:
                normalized_roles.append(normalized)

    if "faculty" not in normalized_roles:
        normalized_roles.insert(0, "faculty")

    return normalized_roles or ["faculty"]


def _seed_default_faculty_accounts():
    try:
        collection = get_faculty_account_collection()
        has_cse_faculty = collection.count_documents({"department": "CSE"}, limit=1) > 0
        if has_cse_faculty:
            return

        timestamp = datetime.now(timezone.utc)
        for account in DEFAULT_FACULTY_ACCOUNTS:
            username = _normalize_faculty_username(account.get("employeeId"))
            collection.update_one(
                {"fac_username": username},
                {
                    "$setOnInsert": {
                        "name": account.get("name", ""),
                        "degree": account.get("degree", ""),
                        "position": account.get("position", ""),
                        "department": account.get("department", ""),
                        "employeeId": username,
                        "fac_username": username,
                        "roles": _normalize_faculty_roles(account.get("roles")),
                        "password": "1234",
                        "must_change_password": True,
                        "isHod": bool(account.get("isHod")),
                        "mentor": bool(account.get("mentor")),
                        "className": account.get("className", ""),
                        "section": account.get("section", ""),
                        "profilePhoto": account.get("profilePhoto", ""),
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    }
                },
                upsert=True,
            )
    except PyMongoError:
        return


def _bool_from_value(value):
    return str(value or "").strip().lower() in {"yes", "y", "true", "1", "mentor"}


def _clean_excel_value(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _get_row_value(row, *keys):
    normalized_row = {str(key).strip().lower(): value for key, value in row.items()}
    for key in keys:
        value = normalized_row.get(str(key).strip().lower(), "")
        if str(value).strip():
            return str(value).strip()
    return ""


def _extract_shared_strings(zip_file):
    try:
        xml_bytes = zip_file.read("xl/sharedStrings.xml")
    except KeyError:
        return []

    root = ET.fromstring(xml_bytes)
    shared_strings = []
    for string_item in root.findall("sheet:si", EXCEL_NS):
        parts = [node.text or "" for node in string_item.findall(".//sheet:t", EXCEL_NS)]
        shared_strings.append("".join(parts))
    return shared_strings


def _column_letters(cell_reference):
    return "".join(character for character in str(cell_reference or "") if character.isalpha())


def _column_index(column_reference):
    index = 0
    for character in str(column_reference or "").upper():
        if not character.isalpha():
            continue
        index = index * 26 + (ord(character) - 64)
    return index


def _extract_excel_rows(file_bytes):
    rows = []
    with ZipFile(BytesIO(file_bytes)) as workbook:
        shared_strings = _extract_shared_strings(workbook)
        try:
            sheet_bytes = workbook.read("xl/worksheets/sheet1.xml")
        except KeyError as error:
            raise ValueError("The Excel workbook does not contain a readable first sheet.") from error

    sheet_root = ET.fromstring(sheet_bytes)
    worksheet_rows = sheet_root.findall(".//sheet:sheetData/sheet:row", EXCEL_NS)
    if not worksheet_rows:
        return []

    headers = []
    for row_index, row_node in enumerate(worksheet_rows):
        row_values = {}
        for cell in row_node.findall("sheet:c", EXCEL_NS):
            reference = cell.attrib.get("r", "")
            column_key = _column_letters(reference)
            cell_type = cell.attrib.get("t")
            value_node = cell.find("sheet:v", EXCEL_NS)
            inline_node = cell.find("sheet:is/sheet:t", EXCEL_NS)

            if cell_type == "s" and value_node is not None:
                try:
                    cell_value = shared_strings[int(value_node.text or "0")]
                except (ValueError, IndexError):
                    cell_value = ""
            elif inline_node is not None:
                cell_value = inline_node.text or ""
            elif value_node is not None:
                cell_value = value_node.text or ""
            else:
                cell_value = ""

            row_values[column_key] = _clean_excel_value(cell_value)

        ordered_values = [
            row_values.get(key, "") for key in sorted(row_values.keys(), key=_column_index)
        ]
        if row_index == 0:
            headers = ordered_values
            continue

        if not any(ordered_values):
            continue

        rows.append(
            {
                str(headers[index]).strip(): ordered_values[index] if index < len(ordered_values) else ""
                for index in range(len(headers))
                if str(headers[index]).strip()
            }
        )

    return rows


def parse_faculty_import_file(uploaded_file):
    extension = Path(getattr(uploaded_file, "name", "")).suffix.lower()
    file_bytes = uploaded_file.read()
    if hasattr(uploaded_file, "seek"):
        uploaded_file.seek(0)

    if extension == ".csv":
        decoded = file_bytes.decode("utf-8-sig")
        reader = csv.DictReader(StringIO(decoded))
        return [{str(key).strip(): _clean_excel_value(value) for key, value in row.items()} for row in reader]

    if extension == ".xlsx":
        return _extract_excel_rows(file_bytes)

    raise ValueError("Only .xlsx and .csv files are supported for faculty import.")


def build_faculty_account_payload(row, department=""):
    employee_id = _normalize_faculty_username(
        _get_row_value(row, "employee id", "employee_id", "employee code", "employee_code", "code", "username")
    )
    name = _get_row_value(row, "name", "faculty name", "faculty_name")
    degree = _get_row_value(row, "degree", "qualification")
    position = _get_row_value(row, "position", "designation", "role")
    row_department = _get_row_value(row, "department")

    roles = _normalize_faculty_roles(
        [
            _get_row_value(row, "access roles", "access_roles", "roles"),
            "mentor" if _bool_from_value(_get_row_value(row, "mentor", "is mentor", "is_mentor")) else "",
            _get_row_value(row, "portal role", "portal_role"),
        ]
    )

    if not employee_id or not name or not degree or not position:
        raise ValueError("Each faculty row must include employee ID, name, degree, and position.")

    return {
        "employeeId": employee_id,
        "name": name,
        "degree": degree,
        "position": position,
        "department": row_department or department,
        "roles": roles,
    }



def _serialize_student(document):
    serialized = dict(document)
    serialized["id"] = str(serialized.pop("_id"))
    if "created_at" in serialized and serialized["created_at"] is not None:
        serialized["created_at"] = _serialize_datetime_value(serialized["created_at"])
    return serialized


def _serialize_faculty_account(document):
    serialized = dict(document)
    serialized["id"] = str(serialized.pop("_id"))
    if "created_at" in serialized and serialized["created_at"] is not None:
        serialized["created_at"] = _serialize_datetime_value(serialized["created_at"])
    if "updated_at" in serialized and serialized["updated_at"] is not None:
        serialized["updated_at"] = _serialize_datetime_value(serialized["updated_at"])
    serialized.pop("password", None)
    return serialized


def _serialize_student_account(document):
    serialized = dict(document)
    serialized["id"] = str(serialized.pop("_id"))
    if "created_at" in serialized and serialized["created_at"] is not None:
        serialized["created_at"] = _serialize_datetime_value(serialized["created_at"])
    if "updated_at" in serialized and serialized["updated_at"] is not None:
        serialized["updated_at"] = _serialize_datetime_value(serialized["updated_at"])
    serialized.pop("password", None)
    return serialized


def _serialize_datetime_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


STUDENT_PROFILE_COMPLETION_FIELDS = [
    "classAdvisor",
    "mentor",
    "firstName",
    "lastName",
    "department",
    "degree",
    "year",
    "batch",
    "dob",
    "gender",
    "blood",
    "aadhar",
    "primaryEmail",
    "phoneNumber",
    "whatsappNumber",
    "residentialAddress",
    "fatherName",
    "motherName",
    "fatherMobileNumber",
    "motherMobileNumber",
    "regno",
    "sslcBoard",
    "sslcMedium",
    "sslcSchoolName",
    "sslcLocation",
    "sslcPercentage",
    "sslcYear",
    "hscBoard",
    "hscMedium",
    "hscSchoolName",
    "hscLocation",
    "hscPercentage",
    "hscYear",
    "diplomaMedium",
    "className",
    "section",
    "currentArrears",
    "historyArrears",
    "hardwareSkills",
    "softwareSkills",
    "domainSkills",
    "placement",
]


def _has_meaningful_value(value):
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (list, tuple)):
        return any(_has_meaningful_value(item) for item in value)
    if isinstance(value, dict):
        return any(_has_meaningful_value(item) for item in value.values())
    return str(value).strip() != ""


def _get_student_documents(student):
    documents = (student or {}).get("documents")
    return documents if isinstance(documents, dict) else {}


def _calculate_student_profile_completion(student):
    if not student:
        return 0

    documents = _get_student_documents(student)
    completed = sum(1 for field in STUDENT_PROFILE_COMPLETION_FIELDS if _has_meaningful_value(student.get(field)))

    extra_checks = [
        _has_meaningful_value(student.get("languagesKnown")),
        _has_meaningful_value(student.get("projects")),
        _has_meaningful_value(student.get("internships")),
        _has_meaningful_value(student.get("certifications")),
        _has_meaningful_value(student.get("interestedDomains")),
        bool(student.get("declarationAgreed")),
        _has_meaningful_value(documents.get("tenthMarksheet")),
        _has_meaningful_value(documents.get("twelfthMarksheet")),
        _has_meaningful_value(documents.get("collegeIdCard")),
        _has_meaningful_value(documents.get("aadharCard")),
        _has_meaningful_value(documents.get("semesterMarksheets")),
    ]

    total_fields = len(STUDENT_PROFILE_COMPLETION_FIELDS) + len(extra_checks)
    completed += sum(1 for check in extra_checks if check)
    return round((completed / total_fields) * 100) if total_fields else 0


def _serialize_faculty_schedule_event(document):
    serialized = dict(document)
    serialized["id"] = str(serialized.pop("_id"))
    if "created_at" in serialized and serialized["created_at"] is not None:
        serialized["created_at"] = serialized["created_at"].isoformat()
    if "updated_at" in serialized and serialized["updated_at"] is not None:
        serialized["updated_at"] = serialized["updated_at"].isoformat()
    event_date = serialized.get("eventDate")
    if event_date is not None:
        serialized["eventDate"] = event_date.isoformat()
    return serialized


def create_student(payload):
    collection = get_student_collection()
    regno = str(payload.get("regno", "")).strip()
    student_account = (
        get_student_account_collection().find_one({"username": regno.upper()}) if regno else None
    )
    assignment_defaults = {
        "classAdvisor": str((student_account or {}).get("classAdvisor", "")).strip(),
        "classAdvisorName": str((student_account or {}).get("classAdvisorName", "")).strip(),
        "mentor": str((student_account or {}).get("mentor", "")).strip(),
        "mentorName": str((student_account or {}).get("mentorName", "")).strip(),
    }
    payload_with_assignments = {
        **assignment_defaults,
        **payload,
    }
    existing_document = collection.find_one({"regno": regno}) if regno else None
    timestamp = datetime.now(timezone.utc)

    if existing_document:
        updated_document = {
            **existing_document,
            **payload_with_assignments,
            "created_at": existing_document.get("created_at", timestamp),
            "updated_at": timestamp,
        }
        collection.update_one({"_id": existing_document["_id"]}, {"$set": updated_document})
        saved_document = collection.find_one({"_id": existing_document["_id"]})
        return _serialize_student(saved_document)

    document = {
        **payload_with_assignments,
        "created_at": timestamp,
    }
    result = collection.insert_one(document)
    created_document = collection.find_one({"_id": result.inserted_id})
    return _serialize_student(created_document)


def create_faculty_account(payload):
    _seed_default_faculty_accounts()
    collection = get_faculty_account_collection()
    timestamp = datetime.now(timezone.utc)
    faculty_username = _normalize_faculty_username(
        payload.get("employeeId") or payload.get("employee_code") or payload.get("fac_username")
    )
    if not faculty_username:
        raise ValueError("Employee ID is required for faculty accounts.")

    roles = _normalize_faculty_roles(payload.get("roles"))
    existing_account = collection.find_one({"fac_username": faculty_username})

    if existing_account:
        updated_document = {
            **existing_account,
            "name": str(payload.get("name", existing_account.get("name", ""))).strip(),
            "degree": str(payload.get("degree", existing_account.get("degree", ""))).strip(),
            "position": str(payload.get("position", existing_account.get("position", ""))).strip(),
            "department": str(payload.get("department", existing_account.get("department", ""))).strip(),
            "employeeId": faculty_username,
            "fac_username": faculty_username,
            "roles": roles,
            "profilePhoto": str(payload.get("profilePhoto", existing_account.get("profilePhoto", ""))).strip(),
            "updated_at": timestamp,
        }
        collection.update_one({"_id": existing_account["_id"]}, {"$set": updated_document})
        saved_document = collection.find_one({"_id": existing_account["_id"]})
        return _serialize_faculty_account(saved_document)

    document = {
        "name": str(payload.get("name", "")).strip(),
        "degree": str(payload.get("degree", "")).strip(),
        "position": str(payload.get("position", "")).strip(),
        "department": str(payload.get("department", "")).strip(),
        "employeeId": faculty_username,
        "fac_username": faculty_username,
        "roles": roles,
        "profilePhoto": str(payload.get("profilePhoto", "")).strip(),
        "password": "1234",
        "must_change_password": True,
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    result = collection.insert_one(document)
    created_document = collection.find_one({"_id": result.inserted_id})
    return _serialize_faculty_account(created_document)


def list_faculty_accounts(department=None):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        normalized_department = _normalize_department_value(department)
        faculty_accounts = collection.find().sort("created_at", -1)
        serialized_accounts = [
            _serialize_faculty_account(account)
            for account in faculty_accounts
            if not normalized_department
            or _normalize_department_value(account.get("department", "")) == normalized_department
        ]
        return _merge_faculty_records(
            serialized_accounts,
            _default_faculty_records_for_department(department),
        )
    except PyMongoError:
        return _default_faculty_records_for_department(department)


def delete_faculty_account(faculty_id):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        object_id = ObjectId(faculty_id)
        account = collection.find_one({"_id": object_id})
        if not account:
            return False

        collection.delete_one({"_id": object_id})
        return True
    except (PyMongoError, TypeError, ValueError):
        return False


def authenticate_faculty_account(username, password, requested_role=None):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        account = collection.find_one({"fac_username": _normalize_faculty_username(username)})
        if not account:
            account = _default_faculty_account_by_username(username)
        if not account:
            return None, "Invalid faculty username or password."

        if account.get("password") != password:
            return None, "Invalid faculty username or password."

        roles = _normalize_faculty_roles(account.get("roles"))
        if requested_role and requested_role not in roles:
            return None, f"This account is not allowed for {requested_role} login."

        return account, None
    except PyMongoError:
        return None, "Unable to verify faculty credentials."


def update_faculty_password(username, new_password):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        account = collection.find_one({"fac_username": _normalize_faculty_username(username)})
        if not account:
            account = _default_faculty_account_by_username(username)
        if not account:
            return None

        updated_account = _upsert_faculty_account_document(
            account,
            password=new_password,
            must_change_password=False,
        )
        return _serialize_faculty_account(updated_account)
    except PyMongoError:
        return None


def update_faculty_roles(username, roles, is_hod=None, class_name=None, section=None):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        account = collection.find_one({"fac_username": _normalize_faculty_username(username)})
        if not account:
            account = _default_faculty_account_by_username(username)
        if not account:
            return None

        updated_account = _upsert_faculty_account_document(
            {
                **account,
                "roles": _normalize_faculty_roles(roles),
                "isHod": bool(account.get("isHod")) if is_hod is None else bool(is_hod),
                "mentor": "mentor" in _normalize_faculty_roles(roles),
                "className": str(account.get("className", "") if class_name is None else class_name).strip(),
                "section": str(account.get("section", "") if section is None else section).strip(),
            }
        )
        return _serialize_faculty_account(updated_account)
    except PyMongoError:
        return None


def update_faculty_profile(username, profile_photo=""):
    try:
        _seed_default_faculty_accounts()
        collection = get_faculty_account_collection()
        account = collection.find_one({"fac_username": _normalize_faculty_username(username)})
        if not account:
            account = _default_faculty_account_by_username(username)
        if not account:
            return None

        updated_account = _upsert_faculty_account_document(
            {
                **account,
                "profilePhoto": str(profile_photo or account.get("profilePhoto", "")).strip(),
            }
        )
        return _serialize_faculty_account(updated_account)
    except PyMongoError:
        return None


def import_faculty_accounts(rows, department=""):
    imported_accounts = []

    for row in rows:
        payload = build_faculty_account_payload(row, department=department)
        imported_accounts.append(create_faculty_account(payload))

    return imported_accounts


def create_student_account(payload):
    collection = get_student_account_collection()
    regno = str(payload.get("regno", "")).strip().upper()
    department = str(payload.get("department", "")).strip()
    existing_account = collection.find_one({"regno": regno})
    if existing_account:
        raise ValueError("A student account already exists for this register number.")

    document = {
        "regno": regno,
        "username": regno,
        "password": "1234",
        "must_change_password": True,
        "department": department,
        "classAdvisor": "",
        "classAdvisorName": "",
        "mentor": "",
        "mentorName": "",
        "added_by": str(payload.get("addedBy", "")).strip(),
        "created_at": datetime.now(timezone.utc),
    }
    result = collection.insert_one(document)
    created_document = collection.find_one({"_id": result.inserted_id})
    return _serialize_student_account(created_document)


def create_faculty_schedule_event(payload):
    collection = get_faculty_schedule_collection()
    timestamp = datetime.now(timezone.utc)
    document = {
        "department": str(payload.get("department", "")).strip(),
        "facultyUsername": str(payload.get("facultyUsername", "")).strip(),
        "title": str(payload.get("title", "")).strip(),
        "eventDate": payload.get("eventDate"),
        "eventTime": str(payload.get("eventTime", "")).strip(),
        "note": str(payload.get("note", "")).strip(),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    result = collection.insert_one(document)
    created_document = collection.find_one({"_id": result.inserted_id})
    return _serialize_faculty_schedule_event(created_document)


def list_faculty_schedule_events(department=None, faculty_username=None):
    try:
        collection = get_faculty_schedule_collection()
        query = {}
        if department:
            query["department"] = str(department).strip()
        if faculty_username:
            query["facultyUsername"] = str(faculty_username).strip()
        events = collection.find(query).sort([("eventDate", 1), ("eventTime", 1), ("created_at", 1)])
        return [_serialize_faculty_schedule_event(event) for event in events]
    except PyMongoError:
        return []


def list_student_accounts(department=None):
    try:
        collection = get_student_account_collection()
        student_collection = get_student_collection()
        query = {}
        if department:
            query["department"] = department
        student_accounts = collection.find(query).sort("created_at", -1)
        serialized_accounts = [_serialize_student_account(account) for account in student_accounts]

        student_records = {
            str(student.get("regno", "")).strip().upper(): student
            for student in (
                _serialize_student(student_document)
                for student_document in student_collection.find()
            )
        }

        for account in serialized_accounts:
            profile = student_records.get(str(account.get("username", "")).strip().upper())
            if profile:
                account["classAdvisor"] = profile.get("classAdvisor", account.get("classAdvisor", ""))
                account["classAdvisorName"] = profile.get(
                    "classAdvisorName", account.get("classAdvisorName", "")
                )
                account["mentor"] = profile.get("mentor", account.get("mentor", ""))
                account["mentorName"] = profile.get("mentorName", account.get("mentorName", ""))
            account["profileCompletion"] = _calculate_student_profile_completion(profile)

        return serialized_accounts
    except PyMongoError:
        return []


def delete_student_account(student_account_id):
    try:
        collection = get_student_account_collection()
        object_id = ObjectId(student_account_id)
        account = collection.find_one({"_id": object_id})
        if not account:
            return False

        collection.delete_one({"_id": object_id})
        return True
    except (PyMongoError, TypeError, ValueError):
        return False


def authenticate_student_account(username, password):
    try:
        collection = get_student_account_collection()
        account = collection.find_one({"username": str(username).strip().upper()})
        if not account:
            return None, "Invalid register number or password."
        if account.get("password") != password:
            return None, "Invalid register number or password."
        return account, None
    except PyMongoError:
        return None, "Unable to verify student credentials."


def update_student_password(username, new_password):
    try:
        collection = get_student_account_collection()
        account = collection.find_one({"username": str(username).strip().upper()})
        if not account:
            return None
        collection.update_one(
            {"_id": account["_id"]},
            {
                "$set": {
                    "password": new_password,
                    "must_change_password": False,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        updated_account = collection.find_one({"_id": account["_id"]})
        return _serialize_student_account(updated_account)
    except PyMongoError:
        return None


def update_student_faculty_mapping(
    regno,
    class_advisor="",
    class_advisor_name="",
    mentor="",
    mentor_name="",
):
    try:
        student_collection = get_student_collection()
        student_account_collection = get_student_account_collection()
        normalized_regno = str(regno).strip().upper()
        student = student_collection.find_one({"regno": normalized_regno})
        student_account = student_account_collection.find_one({"username": normalized_regno})
        if not student and not student_account:
            return None

        update_payload = {
            "classAdvisor": str(class_advisor or "").strip(),
            "classAdvisorName": str(class_advisor_name or "").strip(),
            "mentor": str(mentor or "").strip(),
            "mentorName": str(mentor_name or "").strip(),
            "updated_at": datetime.now(timezone.utc),
        }

        if student:
            student_collection.update_one(
                {"_id": student["_id"]},
                {
                    "$set": update_payload
                },
            )

        if student_account:
            student_account_collection.update_one(
                {"_id": student_account["_id"]},
                {
                    "$set": update_payload
                },
            )

        normalized_mentor = str(mentor or "").strip().lower()
        if normalized_mentor:
            faculty_collection = get_faculty_account_collection()
            faculty_account = faculty_collection.find_one({"fac_username": normalized_mentor})
            if faculty_account:
                existing_roles = _normalize_faculty_roles(faculty_account.get("roles"))
                if "mentor" not in existing_roles:
                    faculty_collection.update_one(
                        {"_id": faculty_account["_id"]},
                        {
                            "$set": {
                                "roles": [*existing_roles, "mentor"],
                                "mentor": True,
                                "updated_at": datetime.now(timezone.utc),
                            }
                        },
                    )

        if student:
            updated_student = student_collection.find_one({"_id": student["_id"]})
            return _serialize_student(updated_student)

        updated_student_account = student_account_collection.find_one({"_id": student_account["_id"]})
        return _serialize_student_account(updated_student_account)
    except PyMongoError:
        return None


def list_students():
    try:
        collection = get_student_collection()
        students = collection.find().sort("created_at", -1)
        return [_serialize_student(student) for student in students]
    except PyMongoError:
        return []


def get_student_by_regno(regno):
    try:
        collection = get_student_collection()
        student = collection.find_one({"regno": str(regno).strip()})
        if not student:
            return None
        return _serialize_student(student)
    except PyMongoError:
        return None


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


def _fetch_collection_records(get_collection, sort_field=None):
    try:
        collection = get_collection()
        cursor = collection.find({}, {"_id": 0})
        if sort_field:
            cursor = cursor.sort(sort_field, 1)
        records = list(cursor)
        return records
    except PyMongoError:
        return []


def list_star_students():
    try:
        collection = get_star_students_collection()
        records = list(collection.find({}, {"_id": 0}).sort("percent", -1))
        return records
    except PyMongoError:
        return []


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
        return records
    except PyMongoError:
        return []


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
        return record or {}
    except PyMongoError:
        return {}


def list_internships():
    return _fetch_collection_records(
        get_internship_collection,
        sort_field="name",
    )


def list_hirings():
    return _fetch_collection_records(
        get_hiring_collection,
        sort_field="company",
    )


def get_contact_details():
    try:
        collection = get_portal_content_collection()
        record = collection.find_one({"key": "contact_details"}, {"_id": 0, "key": 0})
        return record or {}
    except PyMongoError:
        return {}


def list_companies():
    return _fetch_collection_records(
        get_company_collection,
        sort_field="name",
    )


def list_drives():
    return _fetch_collection_records(
        get_drive_collection,
        sort_field="deadline",
    )


def list_applications():
    return _fetch_collection_records(
        get_application_collection,
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
            {"title": "Reports", "items": []},
            {"title": "Activity Logs", "items": []},
        ],
        "announcements": [],
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
