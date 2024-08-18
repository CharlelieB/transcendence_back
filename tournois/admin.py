from django.contrib import admin
from .models import Tournoi

@admin.register(Tournoi)
class TournoiAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type_de_jeu', 'vainqueur')
    list_filter = ('type_de_jeu',)
    search_fields = ('nom', 'type_de_jeu')

    filter_horizontal = ('joueurs',)