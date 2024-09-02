from django.db import models
from users.models import UserProfile

class UserCustom(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE)
    score_win = models.IntegerField(default=5)
    color_1 = models.IntegerField(default=3)
    color_2 = models.IntegerField(default=2)
    color_filet = models.IntegerField(default=4)
    size_raquette = models.CharField(default='regular')
    nb_balls = models.IntegerField(default=1)
    
    def __str__(self):
        return f"Custom {self.user.username}"
