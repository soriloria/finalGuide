from django.urls import path
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserViewSet, CityViewSet, ZoneViewSet, PlaceViewSet,
    SelectedPlaceViewSet, PlanViewSet, ProgressViewSet, CustomRouteViewSet, RoutePlaceViewSet, PasswordResetView,
    PasswordResetConfirmView, ActivateUser, MyTokenObtainPairView
)

# DRF router
router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'cities', CityViewSet, basename='city')
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'places', PlaceViewSet, basename='place')
router.register(r'selected-places', SelectedPlaceViewSet, basename='selectedplace')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'progress', ProgressViewSet, basename='progress')
router.register(r'custom-routes', CustomRouteViewSet, basename='customroute')
router.register(r'route-places', RoutePlaceViewSet, basename='routeplace')


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("password-reset/", PasswordResetView.as_view(), name="password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("activate/<str:token>/", ActivateUser.as_view(), name="activate-user"),
]


urlpatterns += router.urls
