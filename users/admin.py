from django.contrib import admin


from django.contrib import admin
from users.models import GameUser

# Register your models here.
@admin.register(GameUser)
class GenericAdmin(admin.ModelAdmin):
    list_display = ('username', 'email')