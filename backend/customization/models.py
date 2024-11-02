from django.db import models
from users.models import UserProfile

class UserCustom(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    score_win = models.IntegerField(default=5)
    color_rackets = models.IntegerField(default=3)
    color_filet = models.IntegerField(default=4)
    ball_speed = models.CharField(default='regular')
    map = models.IntegerField(default=1)
    game_type = models.BooleanField(default=True)
    drunk_effect = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Custom {self.user.username}"
