import os
from rest_framework import serializers
from django.conf import settings
from ..models import  *

class CustomUserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		exclude = ('password', )