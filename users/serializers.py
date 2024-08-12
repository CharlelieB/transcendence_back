# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, UserStats


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'username', 'password', 'following']  # Ajoutez ici les champs nécessaires
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        following_data = validated_data.pop('following', None)  # Extraire les relations Many-to-Many
        user = UserProfile.objects.create_user(**validated_data)
        
        if following_data:
            user.following.set(following_data)  # Utilisez .set() pour assigner les relations Many-to-Many
        
        return user
        
class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = ['user', 'wins', 'losses', 'games_played']