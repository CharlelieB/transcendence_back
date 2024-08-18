from django.contrib.auth import authenticate
from rest_framework.views import APIView
from django.conf import settings
from django.middleware import csrf
from rest_framework.response import Response
from rest_framework import status, exceptions as rest_exceptions, response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import UserProfile, UserStats
from .serializers import UserProfileSerializer, UserStatsSerializer, UserMinimalSerializer, LoginSerializer 
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt import tokens, views as jwt_views, serializers as jwt_serializers, exceptions as jwt_exceptions

def get_user_tokens(user):
    refresh = tokens.RefreshToken.for_user(user)
    return {
        "refresh_token": str(refresh),
        "access_token": str(refresh.access_token)
    }

class RegisterUserView(APIView):
    """
    API pour enregistrer un nouvel utilisateur.
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @swagger_auto_schema(
        request_body=UserProfileSerializer,
        responses={
            201: openapi.Response('Utilisateur créé', UserProfileSerializer),
            400: 'Email déjà enregistré ou données invalides',
        },
        tags=['Authentication']
    )
    def post(self, request):
        """
        Enregistre un nouvel utilisateur avec les informations fournies.
        """
        if UserProfile.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email déjà enregistré'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UserProfileSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            UserStats.objects.create(user=user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):

    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(email=email, password=password)

        if user is not None:
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

            res.data = tokens
            res["X-CSRFToken"] = csrf.get_token(request)
            return res
        raise rest_exceptions.AuthenticationFailed(
            "Email or Password is incorrect!")

class LogoutView(APIView):

    parser_classes = [JSONParser]

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


class UserView(APIView):
    """
    API pour consulter ou mettre à jour le profil de l'utilisateur connecté.
    """
    permission_classes = (IsAuthenticated,)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @swagger_auto_schema(
        responses={
            200: openapi.Response('Profil utilisateur récupéré', UserProfileSerializer),
        },
        tags=['User Profile']
    )
    def get(self, request):
        """
        Récupère les informations du profil de l'utilisateur connecté.
        """
        serializer = UserProfileSerializer(request.user, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=UserProfileSerializer,
        responses={
            200: 'Profil mis à jour avec succès',
            400: 'Données invalides',
            409: 'Nom d\'utilisateur déjà pris',
        },
        tags=['User Profile']
    )
    def put(self, request):
        """
        Met à jour le profil de l'utilisateur connecté.
        """
        user = UserProfile.objects.get(email=request.user.email)
        
        if 'username' in request.data and request.data['username'] != user.username:
            if UserProfile.objects.filter(username=request.data['username']).exists():
                return Response(
                    {'error': 'Ce nom d\'utilisateur est déjà pris.'},
                    status=status.HTTP_409_CONFLICT
                )
        
        if 'username' in request.data:
            user.username = request.data['username']
        
        if 'password' in request.data:
            user.set_password(request.data['password'])
        
        if 'avatar' in request.data:
            user.avatar = request.data['avatar']
        
        user.save()
        
        return Response({'message': 'Profil mis à jour avec succès'}, status=status.HTTP_200_OK)


class AllUsersView(APIView):
    """
    API pour lister tous les utilisateurs.
    """
    permission_classes = (IsAuthenticated,)

    @swagger_auto_schema(
        responses={
            200: openapi.Response('Liste des utilisateurs', UserProfileSerializer(many=True)),
        },
        tags=['User Profile']
    )
    def get(self, request):
        """
        Récupère une liste de tous les utilisateurs.
        """
        users = UserProfile.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FollowProfileView(APIView):
    """
    API pour suivre un autre utilisateur.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={
            200: 'Utilisateur suivi avec succès',
            400: 'Vous ne pouvez pas vous suivre vous-même',
            404: 'Profil non trouvé',
        },
        tags=['User Interaction']
    )
    def post(self, request, profile_id):
        """
        Suivre un utilisateur spécifique par son ID.
        """

        try:
            user_profile = request.user
            profile_to_follow = UserProfile.objects.get(id=profile_id)
            
            if profile_to_follow == user_profile:
                return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            user_profile.following.add(profile_to_follow)
            user_profile.save()
            
            return Response({'detail': f'Vous suivez maintenant {profile_to_follow.username}.'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profil non trouvé.'}, status=status.HTTP_404_NOT_FOUND)


class UnfollowProfileView(APIView):
    """
    API pour ne plus suivre un utilisateur.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={
            200: 'Utilisateur désuivi avec succès',
            400: 'Vous ne pouvez pas vous désuivre vous-même',
            404: 'Profil non trouvé',
        },
        tags=['User Interaction']
    )
    def post(self, request, profile_id):
        """
        Ne plus suivre un utilisateur spécifique par son ID.
        """
        try:
            user_profile = request.user
            profile_to_unfollow = UserProfile.objects.get(id=profile_id)
            
            if profile_to_unfollow == user_profile:
                return Response({'detail': 'Vous ne pouvez pas vous désuivre vous-même.'}, status=status.HTTP_400_BAD_REQUEST)

            user_profile.following.remove(profile_to_unfollow)
            user_profile.save()

            return Response({'detail': f'Vous avez désuivi {profile_to_unfollow.username}.'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profil non trouvé.'}, status=status.HTTP_404_NOT_FOUND)



class UserFollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        following = user.following.all()
        serializer = UserMinimalSerializer(following, many=True)
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


class BulkUserView(APIView):
    """
    API pour récupérer les détails de plusieurs utilisateurs en une seule requête.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user_ids': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_INTEGER)),
            }
        ),
        responses={
            200: openapi.Response('Liste des utilisateurs', UserProfileSerializer(many=True)),
        },
        tags=['User Profile']
    )
    def post(self, request):
        """
        Récupère les détails de plusieurs utilisateurs à partir d'une liste d'IDs.
        """
        user_ids = request.data.get('user_ids', [])
        users = UserProfile.objects.filter(id__in=user_ids)
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserStatsView(APIView):  # Renommé pour éviter les conflits de nom avec le modèle
    """
    API pour consulter les statistiques d'un utilisateur spécifique.
    """
    permission_classes = [IsAuthenticated]

    user_id_param = openapi.Parameter(
        'user_id', 
        openapi.IN_PATH, 
        description="ID de l'utilisateur", 
        type=openapi.TYPE_INTEGER
    )

    @swagger_auto_schema(
        manual_parameters=[user_id_param],
        responses={
            200: openapi.Response('Statistiques récupérées', UserStatsSerializer),
            403: 'Non autorisé à consulter les statistiques de cet utilisateur',
            404: 'Utilisateur non trouvé',
        },
        tags=['User Statistics'],
    )
    def get(self, request, user_id):
        """
        Récupère les statistiques de l'utilisateur spécifié.
        """
        if request.user.id != user_id:
            return Response(
                {"detail": "Non autorisé à consulter les statistiques de cet utilisateur."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        user_stats = get_object_or_404(UserStats, user__id=user_id)
        serializer = UserStatsSerializer(user_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IncrementWins(APIView):
    """
    API pour augmenter les victoires et les parties jouées d'un utilisateur.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={
            200: "Statistiques mises à jour",
            404: "Utilisateur non trouvé",
        },
        tags=['User Statistics'],
    )
    def post(self, request, user_id):
        """
        Augmente les victoires et les parties jouées de l'utilisateur spécifié.
        """
        user_stats = get_object_or_404(UserStats, user__id=user_id)
        user_stats.wins += 1
        user_stats.games_played += 1
        user_stats.save()
        return Response({"message": "Statistiques mises à jour avec succès"}, status=200)



class IncrementLosses(APIView):
    """
    API pour augmenter les défaites et les parties jouées d'un utilisateur.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={
            200: "Statistiques mises à jour",
            404: "Utilisateur non trouvé",
        },
        tags=['User Statistics'],
    )
    def post(self, request, user_id):
        """
        Augmente les défaites et les parties jouées de l'utilisateur spécifié.
        """
        user_stats = get_object_or_404(UserStats, user__id=user_id)
        user_stats.losses += 1
        user_stats.games_played += 1
        user_stats.save()
        return Response({"message": "Statistiques mises à jour avec succès"}, status=200)
