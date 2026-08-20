from django.urls import path
from rest_framework_simplejwt.views import (TokenRefreshView,TokenObtainPairView,)
from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    LogoutView,
    CheckUsernameView,
    GoogleAuthView,
    GoogleCompleteSignupView,
)
urlpatterns =[
    path("register/",RegisterView.as_view()),
    path("login/",TokenObtainPairView.as_view(),),
    path("token/refresh/",TokenRefreshView.as_view(),),
    path("profile/",ProfileView.as_view(),),
    path("change-password/",ChangePasswordView.as_view(),),
    path("logout/",LogoutView.as_view(),),
    path("check-username/",CheckUsernameView.as_view(),),
    path("google/",GoogleAuthView.as_view(),),
    path("google/complete/",GoogleCompleteSignupView.as_view(),),
]
