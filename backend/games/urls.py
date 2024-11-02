from django.urls import path
from .views import MatchCreateView, MatchListView, UserMatchListView, MatchUpdateScoreView

urlpatterns = [
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('matches/create/', MatchCreateView.as_view(), name='match-create'),
    path('matches/user/', UserMatchListView.as_view(), name='user-match-list'),
    path('matches/<int:pk>/update-score/', MatchUpdateScoreView.as_view(), name='match-update-score'),
]