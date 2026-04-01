import json

from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .file_utils import save_uploaded_file, save_uploaded_pdf, validate_uploaded_file
from .serializers import (
    DepartmentPlacementSerializer,
    LoginSerializer,
    StarStudentSerializer,
    StudentSerializer,
)
from .services import (
    create_department_placement_stat,
    create_star_student,
    create_student,
    get_admin_dashboard_overview,
    get_contact_details,
    get_department_dashboard_overview,
    get_dashboard_overview,
    get_placement_details_content,
    list_hirings,
    list_internships,
    list_department_placement_stats,
    list_star_students,
    list_students,
)


def _get_portal_role(user):
    group_names = {group_name.lower() for group_name in user.groups.values_list("name", flat=True)}
    if user.is_superuser or user.is_staff or "admin" in group_names:
        return "admin"
    if "department" in group_names:
        return "department"
    return None


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
    uploads = {}

    passport_document = request.FILES.get("passportDocument")
    if serializer.validated_data["passportAvailability"] == "Yes":
        if not passport_document:
            return Response(
                {"detail": "passportDocument is required when passport is available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        uploads["passportDocument"] = save_uploaded_pdf(passport_document, regno)
    elif passport_document:
        uploads["passportDocument"] = save_uploaded_pdf(passport_document, regno)

    for field_name in [
        "tenthMarksheet",
        "twelfthMarksheet",
        "collegeIdCard",
        "aadharCard",
    ]:
        uploaded_file = request.FILES.get(field_name)
        if not uploaded_file:
            return Response(
                {"detail": f"{field_name} is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        uploads[field_name] = save_uploaded_file(uploaded_file, regno)

    semester_marksheets = request.FILES.getlist("semesterMarksheets")
    if not semester_marksheets:
        return Response(
            {"detail": "At least one semester marksheet is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    for uploaded_file in semester_marksheets:
        validate_uploaded_file(uploaded_file)

    uploads["semesterMarksheets"] = [
        save_uploaded_file(uploaded_file, regno) for uploaded_file in semester_marksheets
    ]

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


@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

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
    requested_role = serializer.validated_data["loginType"]

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
    return Response({"detail": "Logged out successfully."})


@api_view(["GET"])
def auth_status(request):
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
