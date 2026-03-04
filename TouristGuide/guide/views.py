from rest_framework import viewsets, generics, permissions
from .models import (
    User, City, Zone, Place, Plan,
    Progress, SelectedPlace, CustomRoute, RoutePlace
)
from .serializers import (
    RegisterSerializer, CitySerializer, ZoneSerializer, PlaceSerializer,
    PlanSerializer, ProgressSerializer, SelectedPlaceSerializer,
    CustomRouteSerializer, RoutePlaceSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PasswordResetSerializer, PasswordResetConfirmSerializer
from django.core.signing import BadSignature, TimestampSigner
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
import os

# --------------------------
# Registration
# --------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        user.is_active = False
        user.save()
        FRONTEND_URL = os.getenv("FRONTEND_URL")
        signer = TimestampSigner()
        token = signer.sign(user.pk)
        activation_link = f"{FRONTEND_URL}/#/activate/{token}"

        send_mail(
            "Account activation Tourist Guide",
            f"Please follow the link to activate your account on Tourist Guide: {activation_link}",
            None,
            [user.email],
            fail_silently=True
        )

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response(
            {"message": "Registration successful! Link to activate your account has been sent to your email"},
            status=status.HTTP_201_CREATED
        )


# --------------------------
# User
# --------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAdminUser]


# ======== password reset + activate user ============
class PasswordResetView(APIView):
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        FRONTEND_URL = os.getenv("FRONTEND_URL")

        try:
            user = User.objects.get(email=email)

            if not user.is_active:
                return Response(
                    {"message": "Account not activated. Please verify your email first"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{FRONTEND_URL}/#/reset-password/{uid}/{token}"
            send_mail(
                "Password reset Tourist Guide",
                f"Please follow the link to reset your password on Tourist Guide: {reset_link}",
                None,
                [user.email],
                fail_silently=True
            )

        except User.DoesNotExist:
            pass

        return Response(
            {"message": "If an account exists, a password reset email has been sent"},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data["uidb64"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except:
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "The link is invalid or has expired"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been successfully changed"})


class ActivateUser(APIView):
    def get(self, request, token):
        signer = TimestampSigner()
        try:
            user_id = signer.unsign(token, max_age=60 * 60 * 24)  # 24 hours token
            user = User.objects.get(pk=user_id)
            user.is_active = True
            user.save()
            return Response({"message": "Account activated"})
        except (BadSignature, User.DoesNotExist):
            return Response({"message": "The token is invalid or has expired"}, status=400)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError("Account is not activated. Please confirm your email")
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# ==================================================

# --------------------------
# City & Zone & Place
# --------------------------
class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]


class ZoneViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [permissions.AllowAny]


class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        city_id = self.request.query_params.get("city")
        qs = super().get_queryset()
        if city_id:
            qs = qs.filter(zone__city__id=city_id)
        return qs


# --------------------------
class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Plan.objects.filter(user=self.request.user)


class ProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)


class SelectedPlaceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SelectedPlaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SelectedPlace.objects.filter(user=self.request.user)


class CustomRouteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CustomRouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomRoute.objects.filter(user=self.request.user)


class RoutePlaceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RoutePlaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RoutePlace.objects.filter(route__user=self.request.user)
