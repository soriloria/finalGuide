from rest_framework import serializers
from .models import (
    User, City, Zone, Place, Plan,
    Progress, SelectedPlace, CustomRoute, RoutePlace
)

# --------------------------
# User / Registration
# --------------------------


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password']

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        user = User.objects.create_user(email=email, password=password, username=email)
        user.is_active = False
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField()
    token = serializers.CharField()


# --------------------------
# City
# --------------------------
class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'description', 'photo']


# --------------------------
# Zone
# --------------------------
class ZoneSerializer(serializers.ModelSerializer):
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all())

    class Meta:
        model = Zone
        fields = ['id', 'name', 'description', 'city']


# --------------------------
# Place
# --------------------------
class PlaceSerializer(serializers.ModelSerializer):
    zone = serializers.SlugRelatedField(
        queryset=Zone.objects.all(),
        slug_field='name'
    )
    city = serializers.IntegerField(source="zone.city.id", read_only=True)

    class Meta:
        model = Place
        fields = ['id', 'name', 'description', 'photo1', 'photo2', 'photo3',
                  'latitude', 'longitude', 'zone', 'city']


# --------------------------
# SelectedPlace
# --------------------------
class SelectedPlaceSerializer(serializers.ModelSerializer):
    place = serializers.PrimaryKeyRelatedField(queryset=Place.objects.all())

    class Meta:
        model = SelectedPlace
        fields = ['id', 'place']


# --------------------------
# Plan
# --------------------------
class PlanSerializer(serializers.ModelSerializer):
    zones = serializers.PrimaryKeyRelatedField(queryset=Zone.objects.all(), many=True)

    class Meta:
        model = Plan
        fields = ['id', 'name', 'is_active', 'total_days', 'zones']


# --------------------------
# Progress
# --------------------------
class ProgressSerializer(serializers.ModelSerializer):
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all())
    place = serializers.PrimaryKeyRelatedField(queryset=Place.objects.all())

    class Meta:
        model = Progress
        fields = ['id', 'plan', 'place', 'is_visited']


# --------------------------
# CustomRoute
# --------------------------
class CustomRouteSerializer(serializers.ModelSerializer):
    city = serializers.PrimaryKeyRelatedField(queryset=City.objects.all())

    class Meta:
        model = CustomRoute
        fields = ['id', 'name', 'city']


# --------------------------
# RoutePlace
# --------------------------
class RoutePlaceSerializer(serializers.ModelSerializer):
    route = serializers.PrimaryKeyRelatedField(queryset=CustomRoute.objects.all())
    place = serializers.PrimaryKeyRelatedField(queryset=Place.objects.all())

    class Meta:
        model = RoutePlace
        fields = ['id', 'route', 'place', 'order']
