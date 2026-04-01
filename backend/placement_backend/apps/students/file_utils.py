import os
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import serializers

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def validate_uploaded_file(uploaded_file):
    extension = Path(uploaded_file.name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            "Only PDF, JPG, JPEG, and PNG files are allowed."
        )
    if uploaded_file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError("File size must be 5MB or less.")


def save_uploaded_file(uploaded_file, regno):
    validate_uploaded_file(uploaded_file)
    extension = Path(uploaded_file.name).suffix.lower()
    filename = f"{uuid4().hex}{extension}"
    relative_path = os.path.join("student_uploads", regno, filename)
    saved_path = default_storage.save(relative_path, uploaded_file)
    return f"{settings.MEDIA_URL}{saved_path}"


def save_uploaded_pdf(uploaded_file, regno):
    extension = Path(uploaded_file.name).suffix.lower()
    if extension != ".pdf":
        raise serializers.ValidationError("Passport document must be a PDF file.")
    if uploaded_file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError("File size must be 5MB or less.")
    filename = f"{uuid4().hex}{extension}"
    relative_path = os.path.join("student_uploads", regno, filename)
    saved_path = default_storage.save(relative_path, uploaded_file)
    return f"{settings.MEDIA_URL}{saved_path}"
