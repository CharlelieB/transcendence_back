from django.db import models
from django.contrib.auth.models import AbstractUser

class GameUser(models.Model): 
    username    = models.CharField(max_length=255, unique=True)
    email       = models.EmailField(max_length=255, unique=True)
    password    = models.CharField(max_length=50)
    avatar      = models.ImageField(upload_to='avatars/', blank=True, null=True)
    friends     = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='friend_of')



from django.contrib.auth.models import AbstractUser, Group, Permission

class CustomUser(AbstractUser):
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',  # Nom unique pour le reverse accessor
        blank=True,
        help_text=('The groups this user belongs to. A user will get all permissions granted to each of their groups.'),
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_permissions_set',  # Nom unique pour le reverse accessor
        blank=True,
        help_text=('Specific permissions for this user.'),
        related_query_name='user',
    )
