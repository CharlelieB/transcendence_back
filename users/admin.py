from django.contrib import admin


from django.contrib import admin
from users.models import UserProfile

# Register your models here.
@admin.register(UserProfile)
class GenericAdmin(admin.ModelAdmin):
    list_display = ('username', 'email')