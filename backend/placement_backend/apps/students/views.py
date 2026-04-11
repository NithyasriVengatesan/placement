import json

from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .file_utils import (
    save_faculty_profile_photo,
    save_uploaded_file,
    save_uploaded_pdf,
    validate_uploaded_file,
)
from .serializers import (
    DepartmentPlacementSerializer,
    FacultyAccountSerializer,
    FacultyImportSerializer,
    FacultyPasswordChangeSerializer,
    FacultyProfileUpdateSerializer,
    FacultyRoleUpdateSerializer,
    FacultyScheduleEventSerializer,
    LoginSerializer,
    SessionRoleSwitchSerializer,
    StarStudentSerializer,
    StudentAssignmentSerializer,
    StudentAccountSerializer,
    StudentPasswordChangeSerializer,
    StudentSerializer,
)
from .services import (
    authenticate_faculty_account,
    authenticate_student_account,
    create_department_placement_stat,
    create_faculty_account,
    create_faculty_schedule_event,
    create_star_student,
    create_student,
    create_student_account,
    delete_faculty_account,
    delete_student_account,
    get_admin_dashboard_overview,
    get_student_by_regno,
    get_contact_details,
    get_department_dashboard_overview,
    get_dashboard_overview,
    get_placement_details_content,
    list_hirings,
    list_faculty_accounts,
    list_faculty_schedule_events,
    list_internships,
    list_department_placement_stats,
    list_star_students,
    list_student_accounts,
    list_students,
    parse_faculty_import_file,
    import_faculty_accounts,
    update_faculty_roles,
    update_faculty_password,
    update_faculty_profile,
    update_student_faculty_mapping,
    update_student_password,
)


def _get_portal_role(user):
    group_names = {group_name.lower() for group_name in user.groups.values_list("name", flat=True)}
    if user.is_superuser or user.is_staff or "admin" in group_names:
        return "admin"
    if "hod" in group_names:
        return "hod"
    if "faculty" in group_names:
        return "faculty"
    if "mentor" in group_names:
        return "mentor"
    if "student" in group_names:
        return "student"
    if "department" in group_names:
        return "hod"
    return None


def _set_portal_session(request, payload):
    request.session["portal_user"] = payload
    request.session.modified = True


def _faculty_portal_payload(account, active_role):
    roles = account.get("roles") or ["faculty"]
    normalized_roles = [str(role).strip().lower() for role in roles if str(role).strip()]
    if account.get("isHod") and "hod" not in normalized_roles:
        normalized_roles.append("hod")
    return {
        "username": account.get("fac_username", ""),
        "role": active_role,
        "activeRole": active_role,
        "availableRoles": normalized_roles or ["faculty"],
        "department": account.get("department", ""),
    }


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "placement-backend"})


@api_view(["GET", "POST"])
def student_list_create(request):
    if request.method == "GET":
        return Response(list_students())

    if "form_payload" in request.data:
        try:
            payload = json.loads(request.data["form_payload"])
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid form payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        payload = request.data

    serializer = StudentSerializer(data=payload)
    serializer.is_valid(raise_exception=True)

    regno = serializer.validated_data["regno"]
    existing_student = get_student_by_regno(regno)
    existing_uploads = (existing_student or {}).get("documents", {})
    uploads = {}

    passport_document = request.FILES.get("passportDocument")
    if serializer.validated_data["passportAvailability"] == "Yes":
        if not passport_document and not existing_uploads.get("passportDocument"):
            return Response(
                {"detail": "passportDocument is required when passport is available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if passport_document:
            uploads["passportDocument"] = save_uploaded_pdf(passport_document, regno)
        else:
            uploads["passportDocument"] = existing_uploads.get("passportDocument")
    elif passport_document:
        uploads["passportDocument"] = save_uploaded_pdf(passport_document, regno)

    for field_name in [
        "tenthMarksheet",
        "twelfthMarksheet",
        "collegeIdCard",
        "aadharCard",
    ]:
        uploaded_file = request.FILES.get(field_name)
        if not uploaded_file and not existing_uploads.get(field_name):
            return Response(
                {"detail": f"{field_name} is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if uploaded_file:
            uploads[field_name] = save_uploaded_file(uploaded_file, regno)
        else:
            uploads[field_name] = existing_uploads.get(field_name)

    semester_marksheets = request.FILES.getlist("semesterMarksheets")
    if not semester_marksheets and not existing_uploads.get("semesterMarksheets"):
        return Response(
            {"detail": "At least one semester marksheet is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if semester_marksheets:
        for uploaded_file in semester_marksheets:
            validate_uploaded_file(uploaded_file)

        uploads["semesterMarksheets"] = [
            save_uploaded_file(uploaded_file, regno) for uploaded_file in semester_marksheets
        ]
    else:
        uploads["semesterMarksheets"] = existing_uploads.get("semesterMarksheets", [])

    student = create_student(
        {
            **serializer.validated_data,
            "documents": uploads,
        }
    )
    return Response(student, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def dashboard_overview(request):
    return Response(get_dashboard_overview())


@api_view(["GET"])
def admin_dashboard_overview(request):
    return Response(get_admin_dashboard_overview())


@api_view(["GET"])
def department_dashboard_overview(request):
    return Response(get_department_dashboard_overview())


@api_view(["GET"])
def placement_details_content(request):
    return Response(get_placement_details_content())


@api_view(["GET"])
def internship_list(request):
    return Response(list_internships())


@api_view(["GET"])
def hiring_list(request):
    return Response(list_hirings())


@api_view(["GET"])
def contact_details(request):
    return Response(get_contact_details())


@api_view(["GET", "POST"])
def star_student_list_create(request):
    if request.method == "GET":
        return Response(list_star_students())

    serializer = StarStudentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    record = create_star_student(serializer.validated_data)
    return Response(record, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
def department_placement_list_create(request):
    if request.method == "GET":
        return Response(list_department_placement_stats())

    serializer = DepartmentPlacementSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    record = create_department_placement_stat(serializer.validated_data)
    return Response(record, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
def faculty_account_list_create(request):
    if request.method == "GET":
        department = request.query_params.get("department", "")
        return Response(list_faculty_accounts(department=department or None))

    serializer = FacultyAccountSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        record = create_faculty_account(serializer.validated_data)
    except ValueError as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(record, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def faculty_account_import(request):
    serializer = FacultyImportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        rows = parse_faculty_import_file(serializer.validated_data["file"])
        imported_records = import_faculty_accounts(
            rows,
            department=serializer.validated_data.get("department", ""),
        )
    except ValueError as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {
            "detail": f"Imported {len(imported_records)} faculty account(s).",
            "records": imported_records,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def faculty_account_role_update(request):
    serializer = FacultyRoleUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updated_account = update_faculty_roles(
        serializer.validated_data["username"],
        serializer.validated_data["roles"],
        is_hod=serializer.validated_data.get("isHod"),
        class_name=serializer.validated_data.get("className"),
        section=serializer.validated_data.get("section"),
    )
    if not updated_account:
        return Response(
            {"detail": "Unable to update faculty roles."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(updated_account)


@api_view(["GET", "POST"])
def faculty_schedule_event_list_create(request):
    if request.method == "GET":
        department = request.query_params.get("department", "")
        faculty_username = request.query_params.get("facultyUsername", "")
        return Response(
            list_faculty_schedule_events(
                department=department or None,
                faculty_username=faculty_username or None,
            )
        )

    serializer = FacultyScheduleEventSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    record = create_faculty_schedule_event(serializer.validated_data)
    return Response(record, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
def faculty_account_delete(request, faculty_id):
    deleted = delete_faculty_account(faculty_id)
    if not deleted:
        return Response(
            {"detail": "Unable to delete faculty account."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({"detail": "Faculty account deleted successfully."})


@api_view(["POST"])
def faculty_password_change(request):
    serializer = FacultyPasswordChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updated_account = update_faculty_password(
        serializer.validated_data["username"],
        serializer.validated_data["newPassword"],
    )
    if not updated_account:
        return Response(
            {"detail": "Unable to update faculty password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    active_role = serializer.validated_data.get("role") or "faculty"
    portal_user = _faculty_portal_payload(updated_account, active_role)
    _set_portal_session(request, portal_user)
    return Response(portal_user)


@api_view(["POST"])
def faculty_profile_update(request):
    serializer = FacultyProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updated_account = update_faculty_profile(
        serializer.validated_data["username"],
        profile_photo=save_faculty_profile_photo(
            serializer.validated_data["profilePhoto"],
            serializer.validated_data["username"],
        )
        if serializer.validated_data.get("profilePhoto")
        else "",
    )
    if not updated_account:
        return Response(
            {"detail": "Unable to update faculty profile."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(updated_account)


@api_view(["GET", "POST"])
def student_account_list_create(request):
    if request.method == "GET":
        department = request.query_params.get("department", "")
        return Response(
            list_student_accounts(
                department=department or None,
            )
        )

    serializer = StudentAccountSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        record = create_student_account(serializer.validated_data)
    except ValueError as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(record, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def student_assignment_update(request):
    serializer = StudentAssignmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updated_student = update_student_faculty_mapping(
        regno=serializer.validated_data["regno"],
        class_advisor=serializer.validated_data.get("classAdvisor", ""),
        class_advisor_name=serializer.validated_data.get("classAdvisorName", ""),
        mentor=serializer.validated_data.get("mentor", ""),
        mentor_name=serializer.validated_data.get("mentorName", ""),
    )
    if not updated_student:
        return Response(
            {"detail": "Unable to update student mapping."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(updated_student)


@api_view(["DELETE"])
def student_account_delete(request, student_account_id):
    deleted = delete_student_account(student_account_id)
    if not deleted:
        return Response(
            {"detail": "Unable to delete student account."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({"detail": "Student account deleted successfully."})


@api_view(["POST"])
def student_password_change(request):
    serializer = StudentPasswordChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updated_account = update_student_password(
        serializer.validated_data["username"],
        serializer.validated_data["newPassword"],
    )
    if not updated_account:
        return Response(
            {"detail": "Unable to update student password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    portal_user = {
        "username": updated_account.get("username", ""),
        "role": "student",
        "department": updated_account.get("department", ""),
    }
    _set_portal_session(request, portal_user)
    return Response(portal_user)


@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    requested_role = serializer.validated_data["loginType"]

    if requested_role == "faculty":
        account, error_message = authenticate_faculty_account(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
            requested_role="faculty",
        )
        if not account:
            return Response(
                {"detail": error_message or "Faculty login failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_payload = _faculty_portal_payload(account, "faculty")
        if account.get("must_change_password"):
            return Response({**response_payload, "requiresPasswordChange": True})

        _set_portal_session(request, response_payload)
        return Response(response_payload)

    if requested_role == "mentor":
        account, error_message = authenticate_faculty_account(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
            requested_role="mentor",
        )
        if not account:
            return Response(
                {"detail": error_message or "Mentor login failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_payload = _faculty_portal_payload(account, "mentor")
        if account.get("must_change_password"):
            return Response({**response_payload, "requiresPasswordChange": True})

        _set_portal_session(request, response_payload)
        return Response(response_payload)

    if requested_role in {"class_advisor", "coordinator"}:
        account, error_message = authenticate_faculty_account(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
            requested_role=requested_role,
        )
        if not account:
            return Response(
                {"detail": error_message or f"{requested_role} login failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_payload = _faculty_portal_payload(account, requested_role)
        if account.get("must_change_password"):
            return Response({**response_payload, "requiresPasswordChange": True})

        _set_portal_session(request, response_payload)
        return Response(response_payload)

    if requested_role == "student":
        account, error_message = authenticate_student_account(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
        )
        if not account:
            return Response(
                {"detail": error_message or "Student login failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_payload = {
            "username": account.get("username", ""),
            "role": "student",
            "department": account.get("department", ""),
        }
        if account.get("must_change_password"):
            return Response({**response_payload, "requiresPasswordChange": True})

        _set_portal_session(request, response_payload)
        return Response(response_payload)

    user = authenticate(
        request,
        username=serializer.validated_data["username"],
        password=serializer.validated_data["password"],
    )

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    role = _get_portal_role(user)

    if requested_role == "department":
        requested_role = "hod"

    if role != requested_role:
        return Response(
            {"detail": f"This account is not allowed for {requested_role} login."},
            status=status.HTTP_403_FORBIDDEN,
        )

    login(request, user)
    groups = list(user.groups.values_list("name", flat=True))
    return Response(
        {
            "username": user.username,
            "role": role,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "groups": groups,
        }
    )


@api_view(["POST"])
def logout_view(request):
    logout(request)
    request.session.pop("portal_user", None)
    return Response({"detail": "Logged out successfully."})


@api_view(["POST"])
def auth_switch_role(request):
    portal_user = request.session.get("portal_user")
    if not portal_user:
        return Response(
            {"detail": "You must be logged in to switch roles."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SessionRoleSwitchSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    requested_role = serializer.validated_data["role"]
    available_roles = [str(role).strip().lower() for role in portal_user.get("availableRoles", [])]
    if requested_role not in available_roles:
        return Response(
            {"detail": "This account does not have access to that role."},
            status=status.HTTP_403_FORBIDDEN,
        )

    updated_payload = {**portal_user, "role": requested_role, "activeRole": requested_role}
    _set_portal_session(request, updated_payload)
    return Response(updated_payload)


@api_view(["GET"])
def auth_status(request):
    portal_user = request.session.get("portal_user")
    if portal_user:
        return Response({"authenticated": True, **portal_user})

    if not request.user.is_authenticated:
        return Response({"authenticated": False})

    groups = list(request.user.groups.values_list("name", flat=True))
    role = _get_portal_role(request.user)
    return Response(
        {
            "authenticated": True,
            "username": request.user.username,
            "role": role,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
            "groups": groups,
        }
    )
