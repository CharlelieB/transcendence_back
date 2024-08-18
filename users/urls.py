from django.urls import path

from .views import RegisterUserView, UserView, LoginView, LogoutView, CookieTokenRefreshView, AllUsersView, FollowProfileView, UnfollowProfileView, UserFollowingView, BulkUserView, UserStatsView, IncrementWins, IncrementLosses
# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
# )

urlpatterns = [
    path('users/', AllUsersView.as_view()),
    path('user/', UserView.as_view()),
    path('register/', RegisterUserView.as_view()),
    # path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('user-stats/<int:user_id>/', UserStatsView.as_view(), name='user-stats-detail'),
    path('wins/<int:user_id>/', IncrementWins.as_view(), name='increment-wins'),
    path('losses/<int:user_id>/', IncrementLosses.as_view(), name='increment-losses'),
    path('follow/<int:profile_id>/', FollowProfileView.as_view(), name='follow-profile'),
    path('unfollow/<int:profile_id>/', UnfollowProfileView.as_view(), name='unfollow-profile'),
    path('following/', UserFollowingView.as_view(), name='user-following'),
    path('users/ids/', BulkUserView.as_view(), name='bulk-user'),
]