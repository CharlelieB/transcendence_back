from django.db import models
from django.conf import settings

class Tournoi(models.Model):
    nom = models.CharField(max_length=255)
    joueurs = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='tournois')
    vainqueur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='tournois_gagnes', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    type_de_jeu = models.CharField(max_length=255)

    def __str__(self):
        return self.nom