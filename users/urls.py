from django.urls import path
from .views import RegisterUserView, UserView, AllUsersView, FollowProfileView, UnfollowProfileView, UserFollowersView, BulkUserView, UserStatsView, IncrementWins, IncrementLosses, TOTPCreateView, TOTPVerifyView, ActivateTwoFactorView, DeactivateTwoFactorView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('users/', AllUsersView.as_view()),
    path('user/', UserView.as_view()),
    path('register/', RegisterUserView.as_view()),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-stats/<int:user_id>/', UserStatsView.as_view(), name='user-stats-detail'),
    path('wins/<int:user_id>/', IncrementWins.as_view(), name='increment-wins'),
    path('losses/<int:user_id>/', IncrementLosses.as_view(), name='increment-losses'),
    path('follow/<int:profile_id>/', FollowProfileView.as_view(), name='follow-profile'),
    path('unfollow/<int:profile_id>/', UnfollowProfileView.as_view(), name='unfollow-profile'),
    path('followers/<int:profile_id>/', UserFollowersView.as_view(), name='user-followers'),
    path('users/ids/', BulkUserView.as_view(), name='bulk-user'),
    path('2fa/create/', TOTPCreateView.as_view(), name='totp-create'),
    path('2fa/verify/', TOTPVerifyView.as_view(), name='totp-verify'),
    path('2fa/activate/', ActivateTwoFactorView.as_view(), name='activate-two-factor'),  # Route pour activer le 2FA
    path('2fa/deactivate/', DeactivateTwoFactorView.as_view(), name='deactivate-two-factor'),  # Route pour désactiver le 2FA
]
