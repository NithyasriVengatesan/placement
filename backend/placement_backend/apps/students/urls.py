from django.urls import path

from .views import (
    admin_dashboard_overview,
    auth_status,
    contact_details,
    dashboard_overview,
    department_dashboard_overview,
    department_placement_list_create,
    health_check,
    hiring_list,
    internship_list,
    login_view,
    logout_view,
    placement_details_content,
    star_student_list_create,
    student_list_create,
)

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/login/", login_view, name="auth-login"),
    path("auth/logout/", logout_view, name="auth-logout"),
    path("auth/status/", auth_status, name="auth-status"),
    path("students/", student_list_create, name="student-list-create"),
    path("dashboard/overview/", dashboard_overview, name="dashboard-overview"),
    path("dashboard/admin/overview/", admin_dashboard_overview, name="admin-dashboard-overview"),
    path(
        "dashboard/department/overview/",
        department_dashboard_overview,
        name="department-dashboard-overview",
    ),
    path("dashboard/star-students/", star_student_list_create, name="star-student-list-create"),
    path(
        "dashboard/department-placement/",
        department_placement_list_create,
        name="department-placement-list-create",
    ),
    path("portal/placement-details/", placement_details_content, name="placement-details-content"),
    path("portal/internships/", internship_list, name="internship-list"),
    path("portal/hirings/", hiring_list, name="hiring-list"),
    path("portal/contact/", contact_details, name="contact-details"),
]
