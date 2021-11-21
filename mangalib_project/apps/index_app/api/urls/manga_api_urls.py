from django.urls import path
from ..views import *

urlpatterns = [
	path('', mangaAPI.as_view()),
	path('<int:pk>', mangaAPI.as_view()),
	path('<int:pk>/chapter/<int:number>', chaptersAPI.as_view()),
]