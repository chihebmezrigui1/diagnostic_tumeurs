from django.db import models
import uuid


class Patient(models.Model):
    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("follow-up", "Follow-up"),
        ("discharged", "Discharged"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    last_visit = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Diagnosis(models.Model):
    TUMOR_CHOICES = [
        ("glioma", "Glioma"),
        ("meningioma", "Meningioma"),
        ("pituitary", "Pituitary"),
        ("no_tumor", "No Tumor Detected"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("moderate", "Moderate"),
        ("high", "High"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="diagnoses")
    date = models.DateField()
    tumor_type = models.CharField(max_length=20, choices=TUMOR_CHOICES)
    confidence = models.FloatField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    model_version = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.patient.first_name} - {self.tumor_type} ({self.date})"
