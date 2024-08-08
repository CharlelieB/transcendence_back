from django.contrib import admin
from authenfication.models import GameUser

# Register your models here.
@admin.register(GameUser)
class GenericAdmin(admin.ModelAdmin):
    list_display = ('username', 'email')