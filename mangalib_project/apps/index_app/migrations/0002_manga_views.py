# Generated by Django 3.1.7 on 2021-10-28 22:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('index_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='manga',
            name='views',
            field=models.IntegerField(default=0, verbose_name='Просмотров'),
        ),
    ]