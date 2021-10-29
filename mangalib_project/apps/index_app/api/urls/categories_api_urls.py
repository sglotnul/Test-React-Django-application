from django.urls import path
from ..views import *

urlpatterns = [
	path('', categoriesAPI.as_view()),
	path('<int:pk>', categoriesAPI.as_view()),
]