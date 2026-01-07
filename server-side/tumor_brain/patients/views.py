import uuid
from django.utils import timezone
from django.core.files.storage import FileSystemStorage
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Patient, Diagnosis
from .serializers import PatientSerializer, DiagnosisSerializer
from .ml import predictor_tf
from django.db import transaction
import io
from django.http import HttpResponse
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
import io, csv
from datetime import date, timedelta, datetime
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncMonth

class PatientsListCreateAPIView(APIView):
    """
    GET  /api/patients/     -> liste des patients
    POST /api/patients/     -> ajout d'un patient
    """

    def get(self, request):
        patients = Patient.objects.all().order_by("last_name", "first_name")
        data = PatientSerializer(patients, many=True).data
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientDetailAPIView(APIView):
    """
    GET /api/patients/<uuid:pk>/  -> patient par id
    """

    def get(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        data = PatientSerializer(patient).data
        return Response(data, status=status.HTTP_200_OK)


# --- Diagnosis: prédiction ---
class PredictDiagnosisAPIView(APIView):
    """
    POST /api/diagnosis/predict/
      multipart/form-data:
        - patientId: UUID
        - image: fichier
        - notes: optionnel
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        patient_id = request.data.get("patientId")
        image_file = request.FILES.get("image")
        notes      = request.data.get("notes") or ""

        if not patient_id or not image_file:
            return Response({"detail": "patientId et image sont requis."}, status=400)

        patient = get_object_or_404(Patient, pk=patient_id)

        # 1) sauvegarder l'image
        fs = FileSystemStorage()
        filename  = fs.save(f"diagnostics/{uuid.uuid4()}_{image_file.name}", image_file)
        file_path = fs.path(filename)
        public_url= request.build_absolute_uri(fs.url(filename))

        # 2) prédire
        pred = predictor_tf.predict(file_path)

        # 3) créer le diagnostic
        diag = Diagnosis.objects.create(
            id=uuid.uuid4(),
            patient=patient,
            date=timezone.now().date(),
            tumor_type=pred.tumor_type,
            confidence=pred.confidence,
            severity=pred.severity,
            notes=notes or None,
            image_url=public_url,
            model_version=predictor_tf.MODEL_VERSION,
        )

        return Response(DiagnosisSerializer(diag).data, status=201)
    

class RegisterPatientWithDiagnosisAPIView(APIView):
    """
    POST /api/patients/register/  (multipart/form-data)
      Champs patient:
        - firstName, lastName, age, gender (M|F), dateOfBirth (YYYY-MM-DD),
          phoneNumber, email (opt), lastVisit (opt, sinon today), status (opt, def: active)
      Diagnostic (optionnels):
        - image (file)
        - notes (string)

    Comportement:
      - Crée le patient
      - Si 'image' fournie: sauvegarde l’image, appelle le modèle, crée le Diagnosis
      - Retourne le patient (avec le dernier 'diagnosis' inclus via serializer)
    """
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        # 1) Préparer les données patient (camelCase -> serializer)
        today = timezone.now().date()
        patient_payload = {
            "firstName":   request.data.get("firstName"),
            "lastName":    request.data.get("lastName"),
            "age":         request.data.get("age"),
            "gender":      request.data.get("gender"),
            "dateOfBirth": request.data.get("dateOfBirth"),
            "phoneNumber": request.data.get("phoneNumber"),
            "email":       request.data.get("email") or None,
            "lastVisit":   request.data.get("lastVisit") or today,
            "status":      request.data.get("status") or "active",
        }

        # 2) Valider / créer le patient
        patient_ser = PatientSerializer(data=patient_payload)
        patient_ser.is_valid(raise_exception=True)
        patient = patient_ser.save()

        # 3) Si image => créer un diagnostic
        image_file = request.FILES.get("image")
        notes = request.data.get("notes") or ""

        if image_file:
            fs = FileSystemStorage()
            filename   = fs.save(f"diagnostics/{patient.id}_{image_file.name}", image_file)
            file_path  = fs.path(filename)
            public_url = request.build_absolute_uri(fs.url(filename))

            # Inférence (si erreur => rollback transaction)
            pred = predictor_tf.predict(file_path)

            Diagnosis.objects.create(
                patient=patient,
                date=today,
                tumor_type=pred.tumor_type,
                confidence=pred.confidence,
                severity=pred.severity,
                notes=notes or None,
                image_url=public_url,
                model_version=predictor_tf.MODEL_VERSION,
            )

        # 4) Retourner le patient (avec dernier diagnosis)
        return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)
    

class PatientReportPDFAPIView(APIView):
    """
    GET /api/reports/patient/<uuid:pk>/
    -> génère un PDF "Rapport Patient" avec le dernier diagnostic (+ mini-historique)
    """
    def get(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        diags = list(patient.diagnoses.order_by("-date", "-id"))
        latest = diags[0] if diags else None

        # Buffer PDF
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # En-tête
        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 16)
        c.drawString(2*cm, height - 2*cm, "Rapport Patient - Tumor Brain AI")
        c.setStrokeColor(colors.HexColor("#2563EB"))
        c.setLineWidth(2)
        c.line(2*cm, height - 2.2*cm, width - 2*cm, height - 2.2*cm)

        # Infos patient
        y = height - 3.2*cm
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2*cm, y, "Informations Patient")
        y -= 0.6*cm
        c.setFont("Helvetica", 11)
        lines = [
            f"ID           : {patient.id}",
            f"Nom          : {patient.first_name} {patient.last_name}",
            f"Âge / Sexe   : {patient.age} ans / {'H' if patient.gender=='M' else 'F'}",
            f"Naissance    : {patient.date_of_birth.isoformat()}",
            f"Téléphone    : {patient.phone_number}",
            f"Email        : {patient.email or '-'}",
            f"Statut       : {patient.status}",
            f"Dernière visite : {patient.last_visit.isoformat()}",
        ]
        for line in lines:
            c.drawString(2*cm, y, line)
            y -= 0.5*cm

        # Dernier diagnostic
        y -= 0.3*cm
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2*cm, y, "Dernier Diagnostic")
        y -= 0.6*cm
        c.setFont("Helvetica", 11)
        if latest:
            diag_lines = [
                f"Date         : {latest.date.isoformat()}",
                f"Type         : {latest.tumor_type}",
                f"Confiance    : {round(latest.confidence*100)}%",
                f"Sévérité     : {latest.severity or '-'}",
                f"Modèle       : {latest.model_version}",
                f"Notes        : {(latest.notes or '-')[:120]}",
            ]
            for line in diag_lines:
                c.drawString(2*cm, y, line)
                y -= 0.5*cm

            # (Optionnel) Afficher l'image IRM si locale
            # Si image_url renvoie vers MEDIA_URL, on essaie de l’ouvrir en chemin disque
            if latest.image_url and settings.MEDIA_URL in latest.image_url:
                try:
                    rel = latest.image_url.split(settings.MEDIA_URL, 1)[1]
                    img_path = (settings.MEDIA_ROOT / rel).as_posix()
                    # place l'image en bas de page si la place manque
                    if y < 8*cm:
                        c.showPage()
                        y = height - 3*cm
                    c.drawImage(img_path, 2*cm, y-6*cm, width=8*cm, height=6*cm, preserveAspectRatio=True, mask='auto')
                    y -= 6.5*cm
                except Exception:
                    pass
        else:
            c.drawString(2*cm, y, "Aucun diagnostic disponible.")
            y -= 0.5*cm

        # Historique (jusqu’à 8 dernières lignes)
        if diags:
            if y < 6*cm:
                c.showPage(); y = height - 2.5*cm
            c.setFont("Helvetica-Bold", 12)
            c.drawString(2*cm, y, "Historique des Diagnostics (récents)")
            y -= 0.6*cm
            c.setFont("Helvetica", 11)
            for d in diags[:8]:
                c.drawString(
                    2*cm, y,
                    f"- {d.date.isoformat()} | {d.tumor_type:10s} | {round(d.confidence*100)}% | {d.severity or '-'}"
                )
                y -= 0.5*cm

        c.showPage()
        c.save()
        buffer.seek(0)

        filename = f"rapport_{patient.last_name}_{patient.first_name}.pdf".replace(" ", "_")
        resp = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp
    

# --------- helpers période ---------
def _parse_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return None

def _get_range(request):
    """retourne (start, end) inclusifs. défaut: 90 derniers jours"""
    start = _parse_date(request.GET.get("from"))
    end = _parse_date(request.GET.get("to"))
    if not end:
        end = timezone.now().date()
    if not start:
        start = end - timedelta(days=90)
    return (start, end)

# =========================
#  A) Rapport: Analyse des tumeurs
# =========================
class TumorAnalysisReportPDFAPIView(APIView):
    """
    GET /api/reports/tumors/?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
    - PDF par défaut
    - CSV si ?format=csv
    Contenu:
      * Répartition par type de tumeur
      * Répartition par sévérité
      * Confiance moyenne globale
      * 10 diagnostics récents
    """
    def get(self, request):
        from patients.models import Diagnosis  # import local pour éviter cycles
        start, end = _get_range(request)
        qs = Diagnosis.objects.filter(date__range=(start, end))

        # Agrégats
        by_type = list(qs.values("tumor_type").annotate(n=Count("id")).order_by("-n"))
        by_sev  = list(qs.values("severity").annotate(n=Count("id")).order_by("-n"))
        avg_conf = qs.aggregate(avg=Avg("confidence"))["avg"] or 0.0
        total = qs.count()
        latest = list(qs.select_related("patient").order_by("-date","-id")[:10])

        # Option CSV
        if request.GET.get("format") == "csv":
            buff = io.StringIO()
            w = csv.writer(buff)
            w.writerow(["Période", start.isoformat(), end.isoformat()])
            w.writerow([])
            w.writerow(["Répartition par type"])
            w.writerow(["tumor_type", "count"])
            for row in by_type:
                w.writerow([row["tumor_type"], row["n"]])
            w.writerow([])
            w.writerow(["Répartition par sévérité"])
            w.writerow(["severity", "count"])
            for row in by_sev:
                w.writerow([row["severity"] or "none", row["n"]])
            w.writerow([])
            w.writerow(["Confiance moyenne", f"{avg_conf:.4f}"])
            w.writerow([])
            w.writerow(["Derniers diagnostics (max 10)"])
            w.writerow(["date", "patient_id", "patient_name", "tumor_type", "confidence", "severity"])
            for d in latest:
                w.writerow([
                    d.date.isoformat(),
                    str(d.patient_id),
                    f"{d.patient.first_name} {d.patient.last_name}" if d.patient_id else "",
                    d.tumor_type,
                    f"{d.confidence:.4f}",
                    d.severity or "",
                ])
            resp = HttpResponse(buff.getvalue(), content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="tumor_analysis_{start}_{end}.csv"'
            return resp

        # PDF
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        width, height = A4

        # Titre
        c.setFillColor(colors.HexColor("#111827")); c.setFont("Helvetica-Bold", 16)
        c.drawString(2*cm, height-2*cm, "Analyse des Tumeurs Détectées")
        c.setFont("Helvetica", 10); c.setFillColor(colors.black)
        c.drawString(2*cm, height-2.65*cm, f"Période: {start.isoformat()} → {end.isoformat()}  |  Total diagnostics: {total}")
        c.setStrokeColor(colors.HexColor("#2563EB")); c.setLineWidth(2)
        c.line(2*cm, height-2.9*cm, width-2*cm, height-2.9*cm)

        y = height-3.7*cm
        # Répartition par type
        c.setFont("Helvetica-Bold", 12); c.drawString(2*cm, y, "Répartition par type")
        y -= 0.6*cm; c.setFont("Helvetica", 11)
        if not by_type:
            c.drawString(2*cm, y, "Aucune donnée."); y -= 0.5*cm
        else:
            for row in by_type:
                pct = f"{round((row['n']/total)*100) if total else 0}%"
                c.drawString(2*cm, y, f"- {row['tumor_type']:<12s} : {row['n']}  ({pct})")
                y -= 0.45*cm

        # Répartition par sévérité
        y -= 0.3*cm
        c.setFont("Helvetica-Bold", 12); c.drawString(2*cm, y, "Répartition par sévérité")
        y -= 0.6*cm; c.setFont("Helvetica", 11)
        if not by_sev:
            c.drawString(2*cm, y, "Aucune donnée."); y -= 0.5*cm
        else:
            for row in by_sev:
                label = row["severity"] or "none"
                pct = f"{round((row['n']/total)*100) if total else 0}%"
                c.drawString(2*cm, y, f"- {label:<8s} : {row['n']}  ({pct})")
                y -= 0.45*cm

        # Confiance moyenne
        y -= 0.3*cm
        c.setFont("Helvetica-Bold", 12); c.drawString(2*cm, y, "Confiance moyenne")
        y -= 0.6*cm; c.setFont("Helvetica", 11)
        c.drawString(2*cm, y, f"{round(avg_conf*100)}%"); y -= 0.5*cm

        # Derniers diagnostics
        y -= 0.3*cm
        c.setFont("Helvetica-Bold", 12); c.drawString(2*cm, y, "10 diagnostics récents")
        y -= 0.6*cm; c.setFont("Helvetica", 10)
        if not latest:
            c.drawString(2*cm, y, "Aucune donnée.")
        else:
            for d in latest:
                line = f"{d.date.isoformat()}  |  {d.tumor_type:<10s}  |  {round(d.confidence*100)}%  |  {d.severity or '-'}  |  {d.patient.first_name} {d.patient.last_name}"
                if y < 3*cm:
                    c.showPage(); y = height-2.5*cm; c.setFont("Helvetica", 10)
                c.drawString(2*cm, y, line); y -= 0.45*cm

        c.showPage(); c.save(); buf.seek(0)
        resp = HttpResponse(buf.getvalue(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="tumor_analysis_{start}_{end}.pdf"'
        return resp


# =========================
#  B) Rapport: Statistiques Mensuelles
# =========================
class MonthlyStatsReportPDFAPIView(APIView):
    """
    GET /api/reports/monthly/?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
    - Groupement par mois (YYYY-MM) sur la période
    - Pour chaque mois: total, no_tumor, tumor, confiance_moyenne
    """
    def get(self, request):
        from patients.models import Diagnosis
        start, end = _get_range(request)
        qs = Diagnosis.objects.filter(date__range=(start, end))

        # Groupement par mois
        agg = (
            qs.annotate(m=TruncMonth("date"))
              .values("m")
              .annotate(
                  total=Count("id"),
                  normal=Count("id", filter=Q(tumor_type="no_tumor")),
                  tumors=Count("id", filter=~Q(tumor_type="no_tumor")),
                  avg_conf=Avg("confidence"),
              )
              .order_by("m")
        )

        rows = []
        for r in agg:
            m = r["m"].date() if hasattr(r["m"], "date") else r["m"]
            rows.append({
                "month": m.strftime("%Y-%m"),
                "total": r["total"],
                "normal": r["normal"],
                "tumors": r["tumors"],
                "avg_conf": float(r["avg_conf"] or 0.0),
            })

        # CSV ?
        if request.GET.get("format") == "csv":
            buff = io.StringIO()
            w = csv.writer(buff)
            w.writerow(["Période", start.isoformat(), end.isoformat()])
            w.writerow([])
            w.writerow(["month","total","normal","tumors","avg_confidence"])
            for r in rows:
                w.writerow([r["month"], r["total"], r["normal"], r["tumors"], f"{r['avg_conf']:.4f}"])
            resp = HttpResponse(buff.getvalue(), content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="monthly_stats_{start}_{end}.csv"'
            return resp

        # PDF
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        width, height = A4

        c.setFillColor(colors.HexColor("#111827")); c.setFont("Helvetica-Bold", 16)
        c.drawString(2*cm, height-2*cm, "Statistiques Mensuelles")
        c.setFont("Helvetica", 10); c.setFillColor(colors.black)
        c.drawString(2*cm, height-2.65*cm, f"Période: {start.isoformat()} → {end.isoformat()}")
        c.setStrokeColor(colors.HexColor("#2563EB")); c.setLineWidth(2)
        c.line(2*cm, height-2.9*cm, width-2*cm, height-2.9*cm)

        y = height-3.6*cm
        c.setFont("Helvetica-Bold", 12); c.drawString(2*cm, y, "Mois | Total | Normaux | Tumeurs | Confiance moyenne")
        y -= 0.6*cm; c.setFont("Helvetica", 11)
        if not rows:
            c.drawString(2*cm, y, "Aucune donnée sur la période.")
        else:
            for r in rows:
                line = f"{r['month']}  |  {r['total']:>3}  |  {r['normal']:>3}  |  {r['tumors']:>3}  |  {round(r['avg_conf']*100)}%"
                if y < 3*cm:
                    c.showPage(); y = height-2.5*cm; c.setFont("Helvetica", 11)
                c.drawString(2*cm, y, line); y -= 0.5*cm

        c.showPage(); c.save(); buf.seek(0)
        resp = HttpResponse(buf.getvalue(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="monthly_stats_{start}_{end}.pdf"'
        return resp
    

class PatientDiagnosesListView(APIView):
    """
    GET /api/patients/<uuid:pk>/diagnoses/
    -> Liste l'historique des diagnostics d'un patient (ordonné du plus récent)
    """
    def get(self, request, pk):
        qs = Diagnosis.objects.filter(patient_id=pk).order_by("-date", "-id")
        data = DiagnosisSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class DiagnosisCreateAPIView(APIView):
    """
    POST /api/diagnoses/create/
    Body (JSON):
      {
        "patient": "<UUID patient>",
        "date": "YYYY-MM-DD",
        "tumorType": "glioma|meningioma|pituitary|no_tumor",
        "confidence": 0.92,
        "severity": "low|moderate|high",      # optionnel
        "notes": "string",                    # optionnel
        "imageUrl": "https://...",            # optionnel
        "modelVersion": "v1.4.2"
      }
    """
    def post(self, request):
        serializer = DiagnosisSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(DiagnosisSerializer(instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

