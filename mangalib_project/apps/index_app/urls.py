from django.urls import path, include
from .views import *

urlpatterns = [
	path('mangalist', index),
	path('manga/<int:pk>', index),
	path('manga/<int:pk>/read', index),
]