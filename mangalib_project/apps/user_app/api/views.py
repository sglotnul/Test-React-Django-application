from django.http import JsonResponse
from ..models import *
from .serializers import *
from django.views import View
import time

class userAPI(View):
	def get(self, request, username = None):
		time.sleep(2)
		if username is None:
			if request.user.is_authenticated:
				return JsonResponse({'result' : True, 'data' : CustomUserSerializer(request.user).data})
		try:
			return JsonResponse({'result' : True, 'data' : CustomUserSerializer(CustomUser.objects.get(username=username)).data})
		except:
			return JsonResponse({'result' : False})
		