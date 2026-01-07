from rest_framework import serializers
from .models import Patient, Diagnosis

class DiagnosisSerializer(serializers.ModelSerializer):
    patientId   = serializers.UUIDField(source="patient_id", read_only=True)
    tumorType   = serializers.CharField(source="tumor_type")
    imageUrl    = serializers.URLField(source="image_url", allow_null=True, required=False)
    modelVersion= serializers.CharField(source="model_version")

    class Meta:
        model = Diagnosis
        fields = [
            "id","patientId","date","tumorType","confidence",
            "severity","notes","imageUrl","modelVersion"
        ]

class PatientSerializer(serializers.ModelSerializer):
    # expose les champs en camelCase côté API si ton frontend en envoie
    firstName   = serializers.CharField(source="first_name")
    lastName    = serializers.CharField(source="last_name")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    phoneNumber = serializers.CharField(source="phone_number")
    lastVisit   = serializers.DateField(source="last_visit")
    diagnosis   = serializers.SerializerMethodField(read_only=True)  # dernier diag (optionnel)

    class Meta:
        model = Patient
        fields = [
            "id","firstName","lastName","age","gender","dateOfBirth",
            "phoneNumber","email","diagnosis","lastVisit","status",
        ]

    def get_diagnosis(self, obj):
        latest = obj.diagnoses.order_by("-date", "-id").first()
        return DiagnosisSerializer(latest).data if latest else None
