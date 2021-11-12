from django.urls import path, include
from .views import *

urlpatterns = [
	path('manga', index),
	path('', index)
]