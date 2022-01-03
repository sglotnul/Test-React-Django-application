from django.urls import path
from .views import *

urlpatterns = [
	path('', userAPI.as_view()),
	path('<str:username>', userAPI.as_view()),
]