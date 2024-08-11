from django.urls import path
from .views import RegisterUserView, UserView, AllUsersView, FollowProfileView, UnfollowProfileView, UserFollowersView, BulkUserView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('users/', AllUsersView.as_view()),
    path('user/', UserView.as_view()),
    path('register/', RegisterUserView.as_view()),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('follow/<int:profile_id>/', FollowProfileView.as_view(), name='follow-profile'),
    path('unfollow/<int:profile_id>/', UnfollowProfileView.as_view(), name='unfollow-profile'),
    path('followers/<int:profile_id>/', UserFollowersView.as_view(), name='user-followers'),
    path('users/ids/', BulkUserView.as_view(), name='bulk-user'),
]