from django.contrib import admin
from users.models import UserProfile, UserStats

# Register your models here.
@admin.register(UserProfile)
class GenericAdmin(admin.ModelAdmin):
    list_display = ('username', 'email')
    
admin.site.register(UserStats)