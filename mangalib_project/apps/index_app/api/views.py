from django.http import JsonResponse
from ..models import *
from .serializers import *
from .filters import Filter, get_ordering, get_filtered_by_category_queryset
from django.db.models import Q
from django.views import View

class mangaAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			filters = Filter()
			fields = [f for f in dir(filters) if ('__' not in f)]
			order = get_ordering(request, fields)
			filters.__filter__(request, fields)
			qs = get_filtered_by_category_queryset(request, Manga.objects.filter(*filters).order_by(order))
			return JsonResponse({'result' : True, 'number of coincidences' : len(qs), 'data' : MangaSerializer(qs, many = True).data})
		object = Manga.objects.safe_get(pk)
		if object:
			return JsonResponse({'result' : True, 'data' : MangaSerializer(object).data})
		return JsonResponse({'result' : False})

class categoriesAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			qs = Category.objects.all()
			return JsonResponse({'result' : True, 'number of coincidences' : len(qs), 'data' : CategorySerializer(qs, many = True).data})
		object = Category.objects.safe_get(pk)
		if object:
			return JsonResponse({'result' : True, 'data' : CategorySerializer(object).data})
		return JsonResponse({'result' : False})