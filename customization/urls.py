from django.urls import path
from .views import UserCustomView, UpdateUserCustom

urlpatterns = [
    path('view/', UserCustomView.as_view(), name='custom-view'),
    path('update/', UpdateUserCustom.as_view(), name='update_user_custom'),
]