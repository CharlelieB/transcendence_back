"""
URL configuration for transcendence project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.conf import settings
from rest_framework import permissions 
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView #swager


urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),  # Schema principal
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),  # Swagger UI
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),  # Redoc
   # path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/games/', include('games.urls')),
    path('api/tournois/', include('tournois.urls')),
    path('api/customization/', include('customization.urls')),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),  # Catch-all for frontend routes
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
