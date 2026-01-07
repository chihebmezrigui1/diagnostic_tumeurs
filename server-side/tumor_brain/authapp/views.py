# authapp/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .serializers import LoginSerializer, UserSerializer

class CSRFView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        # pose le cookie csrftoken
        return Response({"detail": "ok"})

def set_auth_cookies(response, refresh: RefreshToken):
    access = str(refresh.access_token)
    # ⚠️ Si front et API sont sur des origines différentes en HTTP,
    # il vaut mieux passer par un proxy (SameSite=Lax suffit).
    # Si tu restes cross-site, utilise SameSite=None + Secure=True en HTTPS.
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=False,        # True en prod / si SameSite=None
        samesite="Lax",      # "None" si cross-site en HTTPS
        max_age=60 * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=False,        # True en prod / si SameSite=None
        samesite="Lax",      # "None" si cross-site en HTTPS
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return response

def clear_auth_cookies(response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_or_username = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(
            Q(email__iexact=email_or_username) | Q(username__iexact=email_or_username)
        ).first()
        if not user:
            return Response({"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        resp = Response({"detail": "ok"}, status=status.HTTP_200_OK)
        return set_auth_cookies(resp, refresh)

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        resp = Response({"detail": "déconnecté"}, status=status.HTTP_200_OK)
        return clear_auth_cookies(resp)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=200)
