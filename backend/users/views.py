import base64
from io import BytesIO


import os
import qrcode
from django.shortcuts import get_object_or_404
from customization.models import UserCustom
from django.conf import settings
from django.utils._os import safe_join
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import views, status, permissions, serializers, exceptions as rest_exceptions, response
from django.contrib.auth import authenticate
from django.conf import settings
from django.middleware import csrf
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse  
from .models import UserProfile, UserStats
from .serializers import UserProfileSerializer, UserStatsSerializer, UserMinimalSerializer, LoginSerializer 
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt import tokens, views as jwt_views, serializers as jwt_serializers, exceptions as jwt_exceptions
from datetime import timedelta
from django.utils import timezone



def get_user_tokens(user):
    refresh = tokens.RefreshToken.for_user(user)
    return {
        "refresh_token": str(refresh),
        "access_token": str(refresh.access_token)
    }

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
            UserCustom.objects.create(user=user)
            user.is_connect = True
            user.save()
            tokens = get_user_tokens(user)
            res = response.Response()

            res.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=tokens["access_token"],
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            res.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=tokens["refresh_token"],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            user_id = user.id


            res.data = {
                'id': user_id,
                'access_token': tokens["access_token"],
                'refresh_token': tokens["refresh_token"],
            }

            res["X-CSRFToken"] = csrf.get_token(request)
            return res
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)



class GuestRegisterUserView(APIView):
    serializer_class = UserProfileSerializer

    def post(self, request):
        if UserProfile.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email déjà enregistré'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            UserStats.objects.create(user=user)
            UserCustom.objects.create(user=user)
            
            user.is_connect = True
            user.save()

            user_serializer = UserMinimalSerializer(user)
            res = Response(
                user_serializer.data,
                status=status.HTTP_200_OK
            )
            res["X-CSRFToken"] = csrf.get_token(request)
            return res
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(
    tags=["Authentication"],
    request=LoginSerializer ,
    description="Cette API permet à un utilisateur de se connecter en fournissant son email et son mot de passe."
)
class LoginView(GenericAPIView):
    serializer_class = LoginSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(email=email, password=password)
        if user is not None:
            now = timezone.now()
            seven_seconds_ago = now - timedelta(seconds=7)

            users_to_disconnect = UserProfile.objects.filter(is_connect=True, last_called_at__lt=seven_seconds_ago)

            for other_user in users_to_disconnect:
                other_user.is_connect = False
                other_user.save()

            connected_users = UserProfile.objects.filter(is_connect=True)

            connected_user_ids = connected_users.values_list('id', flat=True)
            if user.is_connect:
                return Response({'detail': 'Vous êtes déjà connecté.'},status=status.HTTP_409_CONFLICT)
            if user.is_two_factor_enabled:
                return Response({'detail': 'L\'authentification à deux facteurs est activée.'}, status=status.HTTP_403_FORBIDDEN)
            user.is_connect = True
            user.save()
            tokens = get_user_tokens(user)
            res = response.Response()
            res.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=tokens["access_token"],
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            res.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=tokens["refresh_token"],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            user_id = user.id
            res.data = {
                'id': user_id,
                'access_token': tokens["access_token"],
                'refresh_token': tokens["refresh_token"],
            }

            res["X-CSRFToken"] = csrf.get_token(request)
            return res
        raise rest_exceptions.AuthenticationFailed(
            "Email or Password is incorrect!")

@extend_schema(
    tags=["Authentication"],
    request=LoginSerializer ,
    description="Cette API permet à un utilisateur de se connecter en fournissant son email et son mot de passe."
)
class GuestLoginView(GenericAPIView):
    serializer_class = LoginSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):


        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(email=email, password=password)
        if user is not None:
            if user.is_connect:
                return Response({'detail': 'Vous êtes déjà connecté.'},status=status.HTTP_409_CONFLICT)
            if user.is_two_factor_enabled:
                return Response({'detail': 'L\'authentification à deux facteurs est activée.'}, status=status.HTTP_403_FORBIDDEN)
            user.save()

        if user is not None:
            user_serializer = UserMinimalSerializer(user)
            
            res = response.Response(
                user_serializer.data,
                status=status.HTTP_200_OK
            )

            res["X-CSRFToken"] = csrf.get_token(request)

            return res

        raise rest_exceptions.AuthenticationFailed("Email or Password is incorrect!")

@extend_schema(
    tags=["Authentication"],
    description="Connecter un autre user (guest) sur la session de l'hote"
)

class LogoutView(APIView):
    serializer_class = LoginSerializer
    parser_classes = [JSONParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refreshToken = request.COOKIES.get(
                settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            token = tokens.RefreshToken(refreshToken)
            token.blacklist()

            res = response.Response()
            res.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
            res.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            res.delete_cookie("X-CSRFToken")
            res.delete_cookie("csrftoken")
            res["X-CSRFToken"]=None
            user = request.user
            user.is_connect = False
            user.save()
            return res
        except:
            raise rest_exceptions.ParseError("Invalid token")


class CookieTokenRefreshSerializer(jwt_serializers.TokenRefreshSerializer):
    refresh = None

    def validate(self, attrs):
        attrs['refresh'] = self.context['request'].COOKIES.get('refresh')
        if attrs['refresh']:
            return super().validate(attrs)
        else:
            raise jwt_exceptions.InvalidToken(
                'No valid token found in cookie \'refresh\'')


class CookieTokenRefreshView(jwt_views.TokenRefreshView):
    serializer_class = CookieTokenRefreshSerializer

    def finalize_response(self, request, response, *args, **kwargs):

        if 'access' in response.data:
            response.data['access_token'] = response.data.pop('access')

        if response.data.get("refresh"):
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=response.data['refresh'],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            del response.data["refresh"]
        response["X-CSRFToken"] = request.COOKIES.get("csrftoken")
        return super().finalize_response(request, response, *args, **kwargs)


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
    
class UserFollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id):
        profile = get_object_or_404(UserProfile, id=profile_id)
        followers = profile.followers.all()
        serializer = self.serializer_class(followers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# class UserFollowersView(APIView):
#     """
#     API pour consulter les followers d'un utilisateur.
#     """
#     permission_classes = [IsAuthenticated]

#     @swagger_auto_schema(
#         responses={
#             200: openapi.Response('Liste des followers', UserProfileSerializer(many=True)),
#             404: 'Profil non trouvé',
#         },
#         tags=['User Interaction']
#     )
#     def get(self, request, profile_id):
#         """
#         Récupère une liste des followers pour un utilisateur spécifique par son ID.
#         """
#         try:
#             profile = UserProfile.objects.get(id=profile_id)
#             followers = profile.followers.all()
#             serializer = UserProfileSerializer(followers, many=True)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except UserProfile.DoesNotExist:
#             return Response({'detail': 'Profil non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

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

        url = device.config_url

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill='black', back_color='white')

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

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
    serializer_class = LoginSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        login_serializer = LoginSerializer(data=request.data)
        login_serializer.is_valid(raise_exception=True)

        email = login_serializer.validated_data["email"]
        password = login_serializer.validated_data["password"]

        user = authenticate(email=email, password=password)
        if user is None:
            raise rest_exceptions.AuthenticationFailed("Email ou mot de passe incorrect!")

        if user.is_two_factor_enabled:
            totp_serializer = TOTPVerifySerializer(data=request.data)
            if not totp_serializer.is_valid():
                return Response(totp_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            token = totp_serializer.validated_data.get('token')
            device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
            
            if not device or not device.verify_token(token):
                return Response({'detail': 'Code TOTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_connect = True
        user.save()
        tokens = get_user_tokens(user)
        res = Response()

        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=tokens["access_token"],
            expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        res.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
            value=tokens["refresh_token"],
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        res.data = {
            'id': user.id,
            'access_token': tokens["access_token"],
            'refresh_token': tokens["refresh_token"],
        }

        res["X-CSRFToken"] = csrf.get_token(request)
        return res

@extend_schema(tags=['Two-Factor Authentication'])
class guestTOTPVerifyView(APIView):
    serializer_class = LoginSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        login_serializer = LoginSerializer(data=request.data)
        login_serializer.is_valid(raise_exception=True)

        email = login_serializer.validated_data["email"]
        password = login_serializer.validated_data["password"]

        user = authenticate(email=email, password=password)
        if user is None:
            raise rest_exceptions.AuthenticationFailed("Email ou mot de passe incorrect!")

        if user.is_two_factor_enabled:
            totp_serializer = TOTPVerifySerializer(data=request.data)
            if not totp_serializer.is_valid():
                return Response(totp_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            token = totp_serializer.validated_data.get('token')
            device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
            
            if not device or not device.verify_token(token):
                return Response({'detail': 'Code TOTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_connect = True
        user.save()
        user_serializer = UserMinimalSerializer(user)
        res = Response(
            user_serializer.data,
            status=status.HTTP_200_OK
        )
        
        res["X-CSRFToken"] = csrf.get_token(request)
        return res

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

        TOTPDevice.objects.filter(user=user).delete()

        return Response({'message': 'Authentification à deux facteurs désactivée avec succès.'}, status=status.HTTP_200_OK)



class UploadImageView(APIView):
    parser_classes = [MultiPartParser, FormParser]  

    def post(self, request):
        user = request.user

        image = request.FILES['image']

        avatar_folder = os.path.join(settings.MEDIA_ROOT, 'avatars/')


        file_extension = os.path.splitext(image.name)[1]
        valid_extensions = ['.jpg', '.jpeg', '.png']
        if file_extension.lower() not in valid_extensions:
            return Response({"error": "Type de fichier non pris en charge"}, status=status.HTTP_400_BAD_REQUEST)

        filename = f'{user.username}{file_extension}'
        file_path = safe_join(avatar_folder, filename)
        print (file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)
        except IOError as e:
            return Response({"error": "Erreur lors du téléchargement du fichier" }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        relative_path = os.path.join('avatars', filename)
        user.avatar = relative_path 
        user.save()

        file_url = settings.MEDIA_URL + relative_path

        return Response({"message": "Image uploadée avec succès", "file_path": file_url}, status=status.HTTP_201_CREATED)
    
class UpdateLastCalled(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user.last_called_at = timezone.now()
        user.is_connect = True
        user.save()

        now = timezone.now()
        seven_seconds_ago = now - timedelta(seconds=7)

        users_to_disconnect = UserProfile.objects.filter(is_connect=True, last_called_at__lt=seven_seconds_ago)

        for other_user in users_to_disconnect:
            other_user.is_connect = False
            other_user.save()

        connected_users = UserProfile.objects.filter(is_connect=True)

        connected_user_ids = connected_users.values_list('id', flat=True)

        return Response({
            "message": "Le champ last_called_at a été mis à jour avec succès.",
            "connected_user_ids": list(connected_user_ids) 
        }, status=status.HTTP_200_OK)