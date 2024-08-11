from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
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

class FollowProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id):
        try:
            user_profile = request.user
            profile_to_follow = UserProfile.objects.get(id=profile_id)
            
            if profile_to_follow == user_profile:
                return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            user_profile.following.add(profile_to_follow)
            user_profile.save()

            return Response({'detail': f'You are now following {profile_to_follow.username}.'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

class UnfollowProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id):
        try:
            user_profile = request.user  # Assuming request.user is already a UserProfile instance
            profile_to_unfollow = UserProfile.objects.get(id=profile_id)
            
            if profile_to_unfollow == user_profile:
                return Response({'detail': 'You cannot unfollow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            user_profile.following.remove(profile_to_unfollow)
            user_profile.save()

            return Response({'detail': f'You have unfollowed {profile_to_unfollow.username}.'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)


class UserFollowersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id):
        try:
            profile = UserProfile.objects.get(id=profile_id)
            followers = profile.followers.all()  # Accessing the related_name
            serializer = UserProfileSerializer(followers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

class BulkUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_ids = request.data.get('user_ids', [])
        users = UserProfile.objects.filter(id__in=user_ids)
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)