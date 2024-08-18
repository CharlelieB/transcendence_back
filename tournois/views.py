from rest_framework import generics, permissions
from .models import Tournoi
from .serializers import TournoiSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter

@extend_schema(
    summary="Créer un nouveau tournoi",
    description="Permet de créer un nouveau tournoi en fournissant le nom, les joueurs, et le type de jeu.",
    responses={201: TournoiSerializer},
    tags=["Tournois"]  
)
class CreateTournoiView(generics.CreateAPIView):
    queryset = Tournoi.objects.all()
    serializer_class = TournoiSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Permet de spécifier que le vainqueur est optionnel lors de la création
        serializer.save()

@extend_schema(
    summary="Lister les tournois d'un utilisateur",
    description="Récupère tous les tournois auxquels un utilisateur spécifique a participé.",
    parameters=[
        OpenApiParameter(name='user_id', description='ID de l\'utilisateur', required=True, type=int)
    ],
    responses={200: TournoiSerializer(many=True)},
    tags=["Tournois"]  
)
class UserTournoisView(generics.ListAPIView):
    serializer_class = TournoiSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Récupérer l'utilisateur par l'ID passé dans l'URL
        user_id = self.kwargs['user_id']
        return Tournoi.objects.filter(joueurs__id=user_id)
