import requests
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

class RefreshTokenMiddleware(MiddlewareMixin):
    def process_request(self, request):
        access_token = request.META.get('HTTP_AUTHORIZATION', None)
        refresh_token = request.COOKIES.get('refresh_token', None)

        if access_token and refresh_token:
            token = access_token.split()[1]  # Supposant "Bearer <token>"
            try:
                # Vérifier si le token est valide (pas expiré)
                AccessToken(token)
            except TokenError:
                # Si le token est expiré, utiliser le token de rafraîchissement pour obtenir un nouveau token d'accès
                response = requests.post(
                    'http://localhost:8000/api/token/refresh/',
                    json={'refresh': refresh_token},
                )
                if response.status_code == 200:
                    new_access_token = response.json().get('access')
                    # Mettre à jour l'en-tête de la requête avec le nouveau token d'accès
                    request.META['HTTP_AUTHORIZATION'] = f'Bearer {new_access_token}'
                    # Optionnel : Répondre à la requête avec le nouveau token d'accès
                    response.set_cookie('access_token', new_access_token)

        return None
