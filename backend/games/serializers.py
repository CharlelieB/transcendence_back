from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'player1', 'player2', 'player1_score', 'player2_score', 'winner', 'created_at']
        extra_kwargs = {
            'winner': {'required': False, 'allow_null': True},
            'player2_score': {'required': False, 'allow_null': True, 'default': 0},
            'player1_score': {'required': False, 'allow_null': True, 'default': 0},
        }

class MatchUpdateScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['player1_score', 'player2_score', 'winner']

    def validate(self, data):
        """
       Verifier que gagnant correspond bien à celui qui a le score le plus élevé.
        """
        if data.get('winner') == self.instance.player1 and data.get('player1_score', 0) <= data.get('player2_score', 0):
            raise serializers.ValidationError("Le gagnant doit avoir un score plus élevé que l'autre joueur.")
        elif data.get('winner') == self.instance.player2 and data.get('player2_score', 0) <= data.get('player1_score', 0):
            raise serializers.ValidationError("Le gagnant doit avoir un score plus élevé que l'autre joueur.")
        return data
