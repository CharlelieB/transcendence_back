from rest_framework import status, serializers, response
from django.shortcuts import render
from .models import UserCustom
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.views import APIView
from rest_framework import generics
from .serializers import CustomSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
@extend_schema(tags=['User Custom'])
class UserCustomView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_custom = UserCustom.objects.get(user=request.user)
        serializer = CustomSerializer(user_custom)
        return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(tags=['User Custom'])
class UpdateUserCustom(generics.UpdateAPIView):
    serializer_class = CustomSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return UserCustom.objects.get(user=self.request.user)
