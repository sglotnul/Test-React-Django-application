# Generated by Django 3.1.7 on 2021-11-20 13:22

from django.db import migrations
import index_app.models


class Migration(migrations.Migration):

    dependencies = [
        ('index_app', '0002_auto_20211120_0033'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comment',
            name='grade',
            field=index_app.models.IntegerRangedField(verbose_name='Оценка'),
        ),
    ]
