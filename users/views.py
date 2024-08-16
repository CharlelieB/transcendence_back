import base64
from io import BytesIO

import qrcode
from django.shortcuts import get_object_or_404
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import views, status, permissions, serializers 
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse  
from .models import UserProfile, UserStats
from .serializers import UserProfileSerializer, UserStatsSerializer

@extend_schema(
    tags=["Token"],
    summary="Obtenir un token JWT",
    description="Cette API permet d'obtenir un token JWT en fournissant les identifiants d'utilisateur."
)
class CustomTokenObtainPairView(TokenObtainPairView):
    pass 

@extend_schema(
    tags=["Token"],
    summary="Rafraîchir un token JWT",
    description="Cette API permet de rafraîchir un token JWT en fournissant un token de rafraîchissement valide."
)
class CustomTokenRefreshView(TokenRefreshView):
    pass

@extend_schema(tags=['User Management'])
class RegisterUserView(APIView):
    serializer_class = UserProfileSerializer

    def post(self, request):
        if UserProfile.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email déjà enregistré'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            UserStats.objects.create(user=user)
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            return Response({'refresh': str(refresh), 'access': access_token,}, status=status.HTTP_201_CREATED) 

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['User Management'])
class UserView(APIView):
    """
    API pour consulter ou mettre à jour le profil de l'utilisateur connecté.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user

        if 'username' in request.data and request.data['username'] != user.username:
            if UserProfile.objects.filter(username=request.data['username']).exists():
                return Response({'error': 'Ce nom d\'utilisateur est déjà pris.'}, status=status.HTTP_409_CONFLICT)

        if 'username' in request.data:
            user.username = request.data['username']

        if 'password' in request.data:
            user.set_password(request.data['password'])

        if 'avatar' in request.data:
            user.avatar = request.data['avatar']

        user.save()
        return Response({'message': 'Profil mis à jour avec succès'}, status=status.HTTP_200_OK)


@extend_schema(tags=['User Management'])
class AllUsersView(APIView):
    """
    API pour lister tous les utilisateurs.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = UserProfile.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FollowProfileSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField()

@extend_schema(tags=['User Interaction'])
class FollowProfileView(APIView):
    serializer_class = FollowProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, profile_id):
        user_profile = request.user
        profile_to_follow = get_object_or_404(UserProfile, id=profile_id)

        if profile_to_follow == user_profile:
            return Response({'detail': 'Vous ne pouvez pas vous suivre vous-même.'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile.following.add(profile_to_follow)
        user_profile.save()
        return Response({'detail': f'Vous suivez maintenant {profile_to_follow.username}.'}, status=status.HTTP_200_OK)

class UnfollowProfileSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField()

@extend_schema(tags=['User Interaction'])
class UnfollowProfileView(APIView):
    serializer_class = UnfollowProfileSerializer  # Ajout du serializer_class
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, profile_id):
        user_profile = request.user
        profile_to_unfollow = get_object_or_404(UserProfile, id=profile_id)

        if profile_to_unfollow == user_profile:
            return Response({'detail': 'Vous ne pouvez pas vous désuivre vous-même.'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile.following.remove(profile_to_unfollow)
        user_profile.save()
        return Response({'detail': f'Vous avez désuivi {profile_to_unfollow.username}.'}, status=status.HTTP_200_OK)

class UserProfileFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email']  # ou d'autres champs pertinents

@extend_schema(tags=['User Interaction'])
class UserFollowersView(APIView):
    serializer_class = UserProfileFollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, profile_id):
        profile = get_object_or_404(UserProfile, id=profile_id)
        followers = profile.followers.all()
        serializer = self.serializer_class(followers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(tags=['User Management'])
class BulkUserView(APIView):
    """
    API pour récupérer les détails de plusieurs utilisateurs en une seule requête.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_ids = request.data.get('user_ids', [])
        users = UserProfile.objects.filter(id__in=user_ids)
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['User Stats'])
class UserStatsView(APIView):
    """
    API pour consulter les statistiques d'un utilisateur spécifique.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id:
            return Response({"detail": "Non autorisé à consulter les statistiques de cet utilisateur."}, status=status.HTTP_403_FORBIDDEN)

        user_stats = get_object_or_404(UserStats, user__id=user_id)
        serializer = UserStatsSerializer(user_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IncrementSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

@extend_schema(tags=['User Stats'])
class IncrementLosses(APIView):
    serializer_class = IncrementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        user_stats = get_object_or_404(UserStats, user__id=user_id)
        user_stats.losses += 1
        user_stats.games_played += 1
        user_stats.save()
        return Response({"message": "Statistiques mises à jour avec succès"}, status=status.HTTP_200_OK)

@extend_schema(tags=['User Stats'])
class IncrementWins(APIView):
    serializer_class = IncrementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        user_stats = get_object_or_404(UserStats, user__id=user_id)
        user_stats.wins += 1
        user_stats.games_played += 1
        user_stats.save()
        return Response({"message": "Statistiques mises à jour avec succès"}, status=status.HTTP_200_OK)

class EmptySerializer(serializers.Serializer):
    pass


@extend_schema(tags=['Two-Factor Authentication'])
class TOTPCreateView(views.APIView):
    """
    API pour configurer un nouvel appareil TOTP pour un utilisateur.
    """
    serializer_class = EmptySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user

        if not user.is_two_factor_enabled:
            return Response({'detail': 'L\'authentification à deux facteurs n\'est pas activée.'}, status=status.HTTP_400_BAD_REQUEST)

        device, created = TOTPDevice.objects.get_or_create(user=user, confirmed=False)
        if not created and device.confirmed:
            return Response({'detail': 'Appareil TOTP déjà configuré.'}, status=status.HTTP_400_BAD_REQUEST)

        # Générer l'URL de configuration TOTP
        url = device.config_url

        # Générer le QR code à partir de l'URL
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Créer une image QR code
        img = qr.make_image(fill='black', back_color='white')

        # Sauvegarder l'image dans un buffer
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        # Retourner l'image du QR code en base64
        return Response({'qr_code': img_str}, status=status.HTTP_201_CREATED)

class TOTPVerifySerializer(serializers.Serializer):
    token = serializers.CharField(max_length=6, help_text="The TOTP token for verification")

@extend_schema(
    tags=['Two-Factor Authentication'],
    request=TOTPVerifySerializer,
    responses={
        200: OpenApiResponse(description='Appareil TOTP vérifié avec succès.'),
        400: OpenApiResponse(description='Code TOTP invalide ou authentification à deux facteurs non activée.'),
    }
)
@extend_schema(tags=['Two-Factor Authentication'])
class TOTPVerifyView(APIView):
    """
    API pour vérifier et activer un appareil TOTP pour un utilisateur.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = TOTPVerifySerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if not user.is_two_factor_enabled:
            return Response({'detail': 'L\'authentification à deux facteurs n\'est pas activée.'}, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data.get('token')
        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        
        if device and device.verify_token(token):  
            return Response({'message': 'Appareil TOTP vérifié avec succès.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Code TOTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(tags=['Two-Factor Authentication'])
class ActivateTwoFactorView(views.APIView):
    """
    API pour activer l'authentification à deux facteurs.
   """
    serializer_class = EmptySerializer
    permission_classes = [permissions.IsAuthenticated]


    def post(self, request):
        user = request.user
        if user.is_two_factor_enabled:
            return Response({'detail': 'L\'authentification à deux facteurs est déjà activée.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_two_factor_enabled = True
        user.save()
        return Response({'message': 'Authentification à deux facteurs activée avec succès.'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Two-Factor Authentication'])
class DeactivateTwoFactorView(views.APIView):
    """
    API pour désactiver l'authentification à deux facteurs.
    """
    serializer_class = EmptySerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_two_factor_enabled:
            return Response({'detail': 'L\'authentification à deux facteurs n\'est pas activée.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_two_factor_enabled = False
        user.save()

        # Supprimer les dispositifs TOTP existants
        TOTPDevice.objects.filter(user=user).delete()

        return Response({'message': 'Authentification à deux facteurs désactivée avec succès.'}, status=status.HTTP_200_OK)
