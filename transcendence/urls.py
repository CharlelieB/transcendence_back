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
from rest_framework import permissions #swager
from drf_yasg.views import get_schema_view #swager
from drf_yasg import openapi #swager


schema_view = get_schema_view(#swager 
   openapi.Info(
      title="Snippets API",
      default_version='v1',
      description="This API is good",
      contact=openapi.Contact(email="contact@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),#swager
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),#swager
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),#swager
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),  # Catch-all for frontend routes
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL,document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
