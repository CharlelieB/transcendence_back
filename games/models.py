from django.db import models
from users.models import UserProfile

class Match(models.Model):
    player1 = models.ForeignKey(UserProfile, related_name='matches_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(UserProfile, related_name='matches_as_player2', on_delete=models.CASCADE)
    winner = models.ForeignKey(UserProfile, related_name='matches_won', on_delete=models.CASCADE, null=True, blank=True)
    player1_score = models.IntegerField(default=0, null=True, blank=True)
    player2_score = models.IntegerField(default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.player1.username} vs {self.player2.username}"