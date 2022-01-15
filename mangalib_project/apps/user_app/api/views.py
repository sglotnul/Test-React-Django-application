import re
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..models import *
from .serializers import *
from utils.validator import Validator, required_field

class CustomUserValidator(Validator):
	VALIDATION_TEMPLATES = {
		'username' : r'[\S]+', 
		'email' : r'[a-zA-Z0-9_]+@[a-zA-Z0-9-]+?\.[a-zA-Z0-9-]+',
	}

	@required_field
	def username(self, username):
		user = CustomUser.objects.safe_get(username=username)
		if not user is None:
			raise Exception('user with this username already exists')
		return re.fullmatch(self.VALIDATION_TEMPLATES['username'], username)

	@required_field	
	def email(self, email):
		user = CustomUser.objects.safe_get(email=email)
		if not user is None:
			raise Exception('user with this email already exists')
		return re.fullmatch(self.VALIDATION_TEMPLATES['email'], email)

	@required_field
	def password(self, password):
		return password


def create_user(data):
	password = data.pop('password')
	user = CustomUser.objects.create(**data)
	user.set_password(password)
	user.save()

	return user

@method_decorator(csrf_exempt, name='dispatch')
class userAPI(View):
	def get(self, request, username = None):
		if username is None:
			if request.user.is_authenticated: 
				return JsonResponse({'result' : True, 'data' : CustomUserSerializer(request.user).data})
		user_object = CustomUser.objects.safe_get(username=username)
		if user_object:
			return JsonResponse({'result' : True, 'data' : CustomUserSerializer(user_object).data})
		return JsonResponse({'result' : False})

	def post(self, request, username = None):
		validator = CustomUserValidator(request)
		validated_data = {}
		try:
			validated_data = validator.get_validated_data()
		except Exception as notification:
			return JsonResponse({'result' : False, 'notification' : str(notification)})
		user = create_user(validated_data)
		return JsonResponse({'result' : True})

