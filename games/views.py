from django.shortcuts import render

from django.db import models
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Match
from .serializers import MatchSerializer, MatchUpdateScoreSerializer

class MatchCreateView(generics.CreateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        match = serializer.save()

        return Response({"id": match.id}, status=status.HTTP_201_CREATED)

class MatchListView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

class UserMatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Match.objects.filter(models.Q(player1=user) | models.Q(player2=user))

class MatchUpdateScoreView(generics.UpdateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchUpdateScoreSerializer
    permission_classes = [IsAuthenticated]
