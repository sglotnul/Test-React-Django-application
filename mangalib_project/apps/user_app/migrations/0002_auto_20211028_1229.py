# Generated by Django 3.1.7 on 2021-10-28 09:29

from django.db import migrations, models
import user_app.models


class Migration(migrations.Migration):

    dependencies = [
        ('user_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='profile_image',
            field=models.ImageField(blank=True, null=True, upload_to=user_app.models.profile_images_directory_path, verbose_name='Изображение профиля'),
        ),
    ]
