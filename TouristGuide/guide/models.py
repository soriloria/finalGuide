from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=125)
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username


class City(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='city_photos/', blank=True, null=True)

    def __str__(self):
        return self.name


class Zone(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="zones")
    name = models.CharField(max_length=150)
    description = models.TextField()

    def __str__(self):
        return f"{self.name} ({self.city.name})"


class Place(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name="places")
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50)
    photo1 = models.ImageField(upload_to='place_photos/', blank=True, null=True)
    photo2 = models.ImageField(upload_to='place_photos/', blank=True, null=True)
    photo3 = models.ImageField(upload_to='place_photos/', blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"{self.name} ({self.zone.city.name})"


# -------------------------
#   REQUIRED REGISTERED USER
# -------------------------

class Plan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    zones = models.ManyToManyField(Zone)
    total_days = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if self.pk:
            self.total_days = self.zones.count()
        super().save(*args, **kwargs)

    def update_active_status(self):
        all_visited = all(progress.is_visited for progress in self.progress_set.all())
        self.is_active = not all_visited
        self.save()

    def __str__(self):
        return self.name


class Progress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    is_visited = models.BooleanField(default=False)

    def __str__(self):
        status = "Visited" if self.is_visited else "Not Visited"
        return f"{self.user.username} - {self.place.name}: {status}"


class SelectedPlace(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="selected_places")
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="selected_by")

    class Meta:
        unique_together = ("user", "place")

    def __str__(self):
        return f"{self.user.username} - {self.place.name}"


class CustomRoute(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="custom_routes")
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="custom_routes")
    name = models.CharField(max_length=150)

    def __str__(self):
        return f"{self.name} ({self.city.name})"


class RoutePlace(models.Model):
    route = models.ForeignKey(CustomRoute, on_delete=models.CASCADE, related_name="route_places")
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.route.name} - {self.place.name} (#{self.order})"
