from django.urls import path
from .views import CreateTournoiView, UserTournoisView

urlpatterns = [
    path('create/', CreateTournoiView.as_view(), name='create-tournoi'),
    path('user/<int:user_id>/tournois/', UserTournoisView.as_view(), name='user-tournois'),
]

