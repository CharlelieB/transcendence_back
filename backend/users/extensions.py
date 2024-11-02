from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CustomAuthenticationExtension(OpenApiAuthenticationExtension):
    target_class = 'users.authenticate.CustomAuthentication'
    name = 'CustomAuthentication'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
