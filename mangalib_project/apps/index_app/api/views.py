from django.http import JsonResponse
from ..models import *
from .serializers import *
from .filters import MangaFilter
from django.views import View

class mangaAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			filters = MangaFilter(request.GET)	
			qs = Manga.objects.filter(*filters)
			qs = filters.order(qs)
			qs = filters.filter_by_categories(qs)
			qs = filters.get_page(qs)
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