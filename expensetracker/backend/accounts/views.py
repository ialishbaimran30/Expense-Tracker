import re
import secrets

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics,status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.views import (TokenObtainPairView,)
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from .serializers import (RegisterSerializer,UserSerializer,ChangePasswordSerializer,)
# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    # No authenticated user is expected on a public signup endpoint. Leaving the
    # default SessionAuthentication active here means that a browser carrying an
    # unrelated logged-in Django session (e.g. from /admin/) gets CSRF-checked
    # against this endpoint and rejected with 403, even though AllowAny permits it.
    authentication_classes = []
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "success": True,
                "message": "User registered successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    def put(self, request):
        serializer = UserSerializer(request.user,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        # Users who signed up via Google have no usable password yet, so the
        # first time they set one there is no existing password to confirm.
        if user.has_usable_password():
            old_password = serializer.validated_data.get("old_password", "")
            if not old_password or not user.check_password(old_password):
                return Response(
                    {
                        "error": "Old password is incorrect"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            validate_password(serializer.validated_data["new_password"], user=user)
        except DjangoValidationError as exc:
            return Response({"new_password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(
            serializer.validated_data["new_password"]
        )
        user.save()
        return Response(
            {
                "message": "Password updated successfully"
            }
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {
                    "message": "Logged out successfully"
                }
            )
        except Exception:
            return Response(
                {
                    "error": "Invalid token"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


USERNAME_RE = re.compile(r"^[\w.@+-]+$")


def _slugify_username(base):
    base = re.sub(r"[^\w.@+-]", "", base.strip().lower().replace(" ", "."))
    base = base.strip("._")
    return base or "user"


def generate_username_suggestions(base, count=5):
    base = _slugify_username(base)[:20] or "user"
    suggestions = []
    candidates = []

    for suffix in range(1, 100):
        candidates.append(f"{base}{suffix}")
    for _ in range(20):
        candidates.append(f"{base}{secrets.randbelow(9000) + 100}")
    candidates.append(f"{base}_{secrets.randbelow(900) + 100}")

    for candidate in candidates:
        if len(suggestions) >= count:
            break
        if candidate in suggestions:
            continue
        if not User.objects.filter(username__iexact=candidate).exists():
            suggestions.append(candidate)

    return suggestions


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # public lookup; see note on RegisterView

    def get(self, request):
        username = (request.query_params.get("username") or "").strip()

        if len(username) < 3:
            return Response(
                {"available": False, "error": "Username must be at least 3 characters.", "suggestions": []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not USERNAME_RE.match(username):
            return Response(
                {
                    "available": False,
                    "error": "Only letters, numbers and @/./+/-/_ are allowed.",
                    "suggestions": [],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        taken = User.objects.filter(username__iexact=username).exists()
        if not taken:
            return Response({"available": True, "suggestions": []})

        return Response(
            {
                "available": False,
                "suggestions": generate_username_suggestions(username),
            }
        )


def _verify_google_credential(credential):
    if not settings.GOOGLE_CLIENT_ID:
        return None, "Google sign-in is not configured."
    try:
        payload = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        return None, "Invalid or expired Google credential."

    if not payload.get("email_verified", False):
        return None, "Google account email is not verified."

    return payload, None


class GoogleAuthView(APIView):
    """Entry point for 'Continue with Google' on both Login and Signup.

    Existing users (matched by verified Google email) are logged in directly.
    New users are not created here - the frontend collects a unique username
    first and finalizes creation via GoogleCompleteSignupView.
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # public lookup; see note on RegisterView

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"error": "Missing Google credential."}, status=status.HTTP_400_BAD_REQUEST)

        payload, error = _verify_google_credential(credential)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        email = payload["email"]
        user = User.objects.filter(email__iexact=email).first()

        if user:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "status": "login",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                }
            )

        name_base = payload.get("given_name") or email.split("@")[0]
        suggested = generate_username_suggestions(name_base, count=1)
        suggested_username = suggested[0] if suggested else _slugify_username(name_base)

        return Response(
            {
                "status": "signup_required",
                "email": email,
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
                "suggested_username": suggested_username,
            }
        )


class GoogleCompleteSignupView(APIView):
    """Finalizes account creation for a new Google user once they've chosen
    a unique username. Re-verifies the Google credential so the identity
    can't be spoofed by the client."""

    permission_classes = [AllowAny]
    authentication_classes = []  # public lookup; see note on RegisterView

    def post(self, request):
        credential = request.data.get("credential")
        username = (request.data.get("username") or "").strip()

        if not credential:
            return Response({"error": "Missing Google credential."}, status=status.HTTP_400_BAD_REQUEST)
        if len(username) < 3 or not USERNAME_RE.match(username):
            return Response({"username": "Enter a valid username (at least 3 characters)."}, status=status.HTTP_400_BAD_REQUEST)

        payload, error = _verify_google_credential(credential)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        email = payload["email"]

        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            refresh = RefreshToken.for_user(existing)
            return Response(
                {
                    "status": "login",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(existing).data,
                }
            )

        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {
                    "username": "This username is already taken.",
                    "suggestions": generate_username_suggestions(username),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User(
            username=username,
            email=email,
            first_name=payload.get("given_name", ""),
            last_name=payload.get("family_name", ""),
        )
        user.set_unusable_password()
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "status": "created",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
