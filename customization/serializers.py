from rest_framework import serializers
from .models import UserCustom

class CustomSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCustom
        fields = ['score_win', 'color_rackets', 'color_filet', 'ball_speed', 'map', 'game_type', 'drunk_effect']
        