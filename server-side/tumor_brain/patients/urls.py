from django.urls import path
from .views import MonthlyStatsReportPDFAPIView,DiagnosisCreateAPIView, PatientDiagnosesListView, PatientReportPDFAPIView, PatientsListCreateAPIView, PatientDetailAPIView, PredictDiagnosisAPIView, RegisterPatientWithDiagnosisAPIView, TumorAnalysisReportPDFAPIView

urlpatterns = [
    path("patients/", PatientsListCreateAPIView.as_view(), name="patients-list-create"),
    path("patients/<uuid:pk>/", PatientDetailAPIView.as_view(), name="patient-detail"),
    path("diagnosis/predict/", PredictDiagnosisAPIView.as_view(), name="diagnosis-predict"),
    path("patients/register/", RegisterPatientWithDiagnosisAPIView.as_view(), name="patients-register"),
    path("reports/patient/<uuid:pk>/", PatientReportPDFAPIView.as_view(), name="patient-report"),
    path("reports/tumors/", TumorAnalysisReportPDFAPIView.as_view(), name="reports-tumors"),
    path("reports/monthly/", MonthlyStatsReportPDFAPIView.as_view(), name="reports-monthly"),
    path("patients/<uuid:pk>/diagnoses/", PatientDiagnosesListView.as_view(), name="patients-diagnoses"),
    path("diagnoses/create/", DiagnosisCreateAPIView.as_view(), name="diagnoses-create")
    # path("patients/<uuid:pk>/status/", PatientStatusUpdate.as_view()),

]
