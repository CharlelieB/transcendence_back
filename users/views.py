from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import UserProfile
from .serializers import UserProfileSerializer


class RegisterUserView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        if UserProfile.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email déjà enregistré'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UserProfileSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = UserProfile.objects.get(email=request.user.email)
        
         
        # Vérification si le nom d'utilisateur existe déjà
        if 'username' in request.data and request.data['username'] != user.username:
            if UserProfile.objects.filter(username=request.data['username']).exists():
                return Response(
                    {'error': 'Ce nom d\'utilisateur est déjà pris.'},
                    status=status.HTTP_409_CONFLICT
                )
        
        # Mise à jour du nom d'utilisateur
        if 'username' in request.data:
            user.username = request.data['username']
        
        # Mise à jour du mot de passe
        if 'password' in request.data:
            user.set_password(request.data['password'])
        
        # Mise à jour de l'avatar
        if 'avatar' in request.data:
            user.avatar = request.data['avatar']
        
        # Sauvegarder les modifications
        user.save()
        
        return Response({'message': 'Profil mis à jour avec succès'}, status=status.HTTP_200_OK)


class AllUsersView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        users = UserProfile.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
