# Generated by Django 3.1.7 on 2021-11-20 13:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('index_app', '0003_auto_20211120_1622'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='text',
            field=models.TextField(blank=True, verbose_name='Содержание'),
        ),
    ]