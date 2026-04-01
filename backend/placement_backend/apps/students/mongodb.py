from django.conf import settings
from pymongo import MongoClient

client = MongoClient(
    settings.MONGO_URI,
    serverSelectionTimeoutMS=1000,
    connectTimeoutMS=1000,
)
db = client[settings.MONGO_DB_NAME]


def get_student_collection():
    return db["students"]


def get_star_students_collection():
    return db["star_students"]


def get_department_placement_collection():
    return db["department_placement_stats"]


def get_portal_content_collection():
    return db["portal_content"]


def get_internship_collection():
    return db["internships"]


def get_hiring_collection():
    return db["hirings"]


def get_company_collection():
    return db["companies"]


def get_drive_collection():
    return db["placement_drives"]


def get_application_collection():
    return db["applications"]
