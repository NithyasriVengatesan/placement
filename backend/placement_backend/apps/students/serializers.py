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
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    department = serializers.CharField()
    degree = serializers.CharField()
    year = serializers.CharField()
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
    sslcSchoolName = serializers.CharField()
    sslcLocation = serializers.CharField()
    sslcRegisterNo = serializers.CharField(required=False, allow_blank=True)
    sslcPercentage = serializers.CharField()
    sslcYear = serializers.CharField()
    hscBoard = serializers.ChoiceField(
        choices=["CBSE", "STATE BOARD", "MATRICULATION", "ICSE"]
    )
    hscSchoolName = serializers.CharField()
    hscLocation = serializers.CharField()
    hscRegisterNo = serializers.CharField(required=False, allow_blank=True)
    hscPercentage = serializers.CharField()
    hscYear = serializers.CharField()
    diplomaSpecialization = serializers.CharField(required=False, allow_blank=True)
    diplomaInstitute = serializers.CharField(required=False, allow_blank=True)
    diplomaLocation = serializers.CharField(required=False, allow_blank=True)
    diplomaRegisterNo = serializers.CharField(required=False, allow_blank=True)
    diplomaPercentage = serializers.CharField(required=False, allow_blank=True)
    diplomaYear = serializers.CharField(required=False, allow_blank=True)
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
    eligibility = serializers.ChoiceField(choices=["Eligible", "Not Eligible"])
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
    batch = serializers.CharField(required=False, allow_blank=True)
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


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    loginType = serializers.ChoiceField(choices=["admin", "department"])
