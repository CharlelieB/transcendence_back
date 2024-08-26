from rest_framework import serializers
from .models import UserCustom

class CustomSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCustom
        fields = ['score_win', 'color_1', 'color_2', 'color_filet', 'size_raquette', 'nb_balls']
        