from django.shortcuts import render
from .models import UserCustom
from drf_spectacular.utils import extend_schema, OpenApiResponse  
from rest_framework.views import APIView
from rest_framework import generics
from .serializers import CustomSerializer
from rest_framework.permissions import IsAuthenticated





# Create your views here.
@extend_schema(tags=['User Custom'])
class UserCustomView(APIView):   
    def get(self, request):
        serializer_class = UserCustomSerializer
        permission_classes = [permissions.IsAuthenticated]
        return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(tags=['User Custom'])
class UpdateUserCustom(generics.UpdateAPIView):
    queryset = UserCustom.objects.all()
    serializer_class = CustomSerializer
    permission_classes = [IsAuthenticated]