# Generated by Django 5.1 on 2024-08-26 15:26

import users.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='avatar',
            field=models.ImageField(default='/avatars/bilel.jpeg', upload_to=users.models.upload_to),
        ),
    ]
