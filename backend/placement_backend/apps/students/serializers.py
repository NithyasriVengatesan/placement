from rest_framework import serializers


class ProjectSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    technology = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)


class InternshipSerializer(serializers.Serializer):
    company = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, allow_blank=True)
    duration = serializers.CharField(required=False, allow_blank=True)


class CertificationSerializer(serializers.Serializer):
    certification = serializers.CharField(required=False, allow_blank=True)
    platform = serializers.CharField(required=False, allow_blank=True)
    credentialId = serializers.CharField(required=False, allow_blank=True)


class LanguageSerializer(serializers.Serializer):
    language = serializers.CharField(required=False, allow_blank=True)
    proficiencyTestLevel = serializers.CharField(required=False, allow_blank=True)


class StudentSerializer(serializers.Serializer):
    classAdvisor = serializers.CharField(required=False, allow_blank=True)
    classAdvisorName = serializers.CharField(required=False, allow_blank=True)
    mentor = serializers.CharField(required=False, allow_blank=True)
    mentorName = serializers.CharField(required=False, allow_blank=True)
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    department = serializers.CharField()
    degree = serializers.CharField()
    year = serializers.CharField()
    batch = serializers.CharField(required=False, allow_blank=True)
    dob = serializers.CharField(required=False, allow_blank=True)
    age = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    blood = serializers.CharField(required=False, allow_blank=True)
    aadhar = serializers.CharField(required=False, allow_blank=True)
    passportAvailability = serializers.ChoiceField(choices=["Yes", "No"])
    languagesKnown = LanguageSerializer(many=True)
    primaryEmail = serializers.EmailField()
    secondaryEmail = serializers.EmailField(required=False, allow_blank=True)
    phoneNumber = serializers.RegexField(r"^\d{10}$")
    whatsappNumber = serializers.RegexField(r"^\d{10}$")
    residentialAddress = serializers.CharField()
    fatherName = serializers.CharField()
    motherName = serializers.CharField()
    fatherMobileNumber = serializers.RegexField(r"^\d{10}$")
    motherMobileNumber = serializers.RegexField(r"^\d{10}$")
    income = serializers.CharField(required=False, allow_blank=True)
    fatherOccupation = serializers.ChoiceField(choices=["Yes", "No"])
    fatherOrganizationName = serializers.CharField(required=False, allow_blank=True)
    fatherOrganizationContactNumber = serializers.CharField(required=False, allow_blank=True)
    motherOccupation = serializers.ChoiceField(choices=["Yes", "No"])
    motherOrganizationName = serializers.CharField(required=False, allow_blank=True)
    motherOrganizationContactNumber = serializers.CharField(required=False, allow_blank=True)
    regno = serializers.CharField()
    sslcBoard = serializers.ChoiceField(
        choices=["CBSE", "STATE BOARD", "MATRICULATION", "ICSE"]
    )
    sslcMedium = serializers.CharField(required=False, allow_blank=True)
    sslcSchoolName = serializers.CharField()
    sslcLocation = serializers.CharField()
    sslcRegisterNo = serializers.CharField(required=False, allow_blank=True)
    sslcPercentage = serializers.CharField()
    sslcYear = serializers.CharField()
    hscBoard = serializers.ChoiceField(
        choices=["CBSE", "STATE BOARD", "MATRICULATION", "ICSE"]
    )
    hscMedium = serializers.CharField(required=False, allow_blank=True)
    hscSchoolName = serializers.CharField()
    hscLocation = serializers.CharField()
    hscRegisterNo = serializers.CharField(required=False, allow_blank=True)
    hscPercentage = serializers.CharField()
    hscYear = serializers.CharField()
    diplomaSpecialization = serializers.CharField(required=False, allow_blank=True)
    diplomaMedium = serializers.CharField(required=False, allow_blank=True)
    diplomaInstitute = serializers.CharField(required=False, allow_blank=True)
    diplomaLocation = serializers.CharField(required=False, allow_blank=True)
    diplomaRegisterNo = serializers.CharField(required=False, allow_blank=True)
    diplomaPercentage = serializers.CharField(required=False, allow_blank=True)
    diplomaYear = serializers.CharField(required=False, allow_blank=True)
    className = serializers.CharField(required=False, allow_blank=True)
    section = serializers.CharField(required=False, allow_blank=True)
    gpaSem1 = serializers.CharField(required=False, allow_blank=True)
    gpaSem2 = serializers.CharField(required=False, allow_blank=True)
    gpaSem3 = serializers.CharField(required=False, allow_blank=True)
    gpaSem4 = serializers.CharField(required=False, allow_blank=True)
    gpaSem5 = serializers.CharField(required=False, allow_blank=True)
    gpaSem6 = serializers.CharField(required=False, allow_blank=True)
    gpaSem7 = serializers.CharField(required=False, allow_blank=True)
    cgpa = serializers.CharField(required=False, allow_blank=True)
    currentArrears = serializers.ChoiceField(choices=["0", "1", "2", "3", "4", "5"])
    historyArrears = serializers.ChoiceField(choices=["0", "1", "2", "3", "4", "5"])
    eligibility = serializers.ChoiceField(
        choices=["Eligible", "Not Eligible"], required=False, allow_blank=True
    )
    hardwareSkills = serializers.CharField(required=False, allow_blank=True)
    softwareSkills = serializers.CharField(required=False, allow_blank=True)
    domainSkills = serializers.CharField(required=False, allow_blank=True)
    projects = ProjectSerializer(many=True, required=False)
    internships = InternshipSerializer(many=True, required=False)
    certifications = CertificationSerializer(many=True, required=False)
    participatePlacement = serializers.CharField(required=False, allow_blank=True)
    noReason = serializers.CharField(required=False, allow_blank=True)
    companyTraining = serializers.CharField(required=False, allow_blank=True)
    agencyTraining = serializers.CharField(required=False, allow_blank=True)
    interestedDomains = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )
    otherDetails = serializers.CharField(required=False, allow_blank=True)
    placement = serializers.CharField(required=False, allow_blank=True)
    declarationAgreed = serializers.BooleanField()

    def validate(self, attrs):
        if attrs["fatherOccupation"] == "Yes":
            if not attrs.get("fatherOrganizationName") or not attrs.get(
                "fatherOrganizationContactNumber"
            ):
                raise serializers.ValidationError(
                    "Father organization details are required."
                )

        if attrs["motherOccupation"] == "Yes":
            if not attrs.get("motherOrganizationName") or not attrs.get(
                "motherOrganizationContactNumber"
            ):
                raise serializers.ValidationError(
                    "Mother organization details are required."
                )

        if not attrs.get("declarationAgreed"):
            raise serializers.ValidationError(
                {"declarationAgreed": "Declaration must be accepted."}
            )

        languages = attrs.get("languagesKnown", [])
        if not languages or not languages[0].get("language"):
            raise serializers.ValidationError(
                {"languagesKnown": "At least one language is required."}
            )

        return attrs


class StarStudentSerializer(serializers.Serializer):
    name = serializers.CharField()
    student_id = serializers.CharField()
    marks = serializers.IntegerField(min_value=0)
    percent = serializers.FloatField(min_value=0, max_value=100)
    year = serializers.CharField()
    avatar = serializers.URLField(required=False, allow_blank=True)


class DepartmentPlacementSerializer(serializers.Serializer):
    department = serializers.CharField()
    male = serializers.IntegerField(min_value=0)
    female = serializers.IntegerField(min_value=0)


class FacultyAccountSerializer(serializers.Serializer):
    employeeId = serializers.CharField()
    name = serializers.CharField()
    degree = serializers.CharField()
    position = serializers.CharField()
    department = serializers.CharField()
    isHod = serializers.BooleanField(required=False)
    className = serializers.CharField(required=False, allow_blank=True)
    section = serializers.CharField(required=False, allow_blank=True)
    roles = serializers.ListField(
        child=serializers.ChoiceField(
            choices=["faculty", "mentor", "class_advisor", "coordinator"]
        ),
        required=False,
    )


class FacultyPasswordChangeSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(
        choices=["faculty", "mentor", "class_advisor", "coordinator"],
        required=False,
    )
    newPassword = serializers.CharField()
    confirmPassword = serializers.CharField()

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": "New password and confirm password must match."}
        )
        return attrs


class FacultyProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField()
    profilePhoto = serializers.ImageField(required=False)


class FacultyScheduleEventSerializer(serializers.Serializer):
    department = serializers.CharField()
    facultyUsername = serializers.CharField()
    title = serializers.CharField()
    eventDate = serializers.DateField(input_formats=["%Y-%m-%d"])
    eventTime = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


class StudentAccountSerializer(serializers.Serializer):
    regno = serializers.CharField()
    department = serializers.CharField()
    addedBy = serializers.CharField(required=False, allow_blank=True)


class StudentAssignmentSerializer(serializers.Serializer):
    regno = serializers.CharField()
    classAdvisor = serializers.CharField(required=False, allow_blank=True)
    classAdvisorName = serializers.CharField(required=False, allow_blank=True)
    mentor = serializers.CharField(required=False, allow_blank=True)
    mentorName = serializers.CharField(required=False, allow_blank=True)


class StudentPasswordChangeSerializer(serializers.Serializer):
    username = serializers.CharField()
    newPassword = serializers.CharField()
    confirmPassword = serializers.CharField()

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": "New password and confirm password must match."}
            )
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    loginType = serializers.ChoiceField(
        choices=[
            "admin",
            "hod",
            "faculty",
            "mentor",
            "class_advisor",
            "coordinator",
            "student",
            "department",
        ]
    )


class FacultyRoleUpdateSerializer(serializers.Serializer):
    username = serializers.CharField()
    isHod = serializers.BooleanField(required=False)
    className = serializers.CharField(required=False, allow_blank=True)
    section = serializers.CharField(required=False, allow_blank=True)
    roles = serializers.ListField(
        child=serializers.ChoiceField(
            choices=["faculty", "mentor", "class_advisor", "coordinator"]
        ),
        min_length=1,
    )


class FacultyImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    department = serializers.CharField(required=False, allow_blank=True)


class SessionRoleSwitchSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=["faculty", "mentor", "class_advisor", "coordinator"]
    )
