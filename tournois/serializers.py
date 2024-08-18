from rest_framework import serializers
from .models import Tournoi

class TournoiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournoi
        fields = ['id', 'nom', 'joueurs', 'vainqueur', 'type_de_jeu']
