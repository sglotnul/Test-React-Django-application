# Generated by Django 3.1.7 on 2022-01-10 15:43

from django.db import migrations
import user_app.models


class Migration(migrations.Migration):

    dependencies = [
        ('user_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelManagers(
            name='customuser',
            managers=[
                ('objects', user_app.models.UserManager()),
            ],
        ),
    ]