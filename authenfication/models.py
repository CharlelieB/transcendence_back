from django.db import models

class GameUser(models.Model): 
    username    = models.CharField(max_length=255, unique=True)
    email       = models.EmailField(max_length=255, unique=True)
    password    = models.CharField(max_length=50)
    avatar      = models.ImageField(upload_to='avatars/', blank=True, null=True)
    friends     = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='friend_of')