from django.http import JsonResponse
from ..models import *
from .serializers import *
from .paginator import Paginator
from .filters import MangaFilter
from django.views import View
import time

class mangaAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			filters = MangaFilter(request.GET)	
			qs = filters.filter(Manga)
			paginator = Paginator(qs)
			qs = filters.get_page(paginator)
			return JsonResponse({'result' : True, 'number of coincidences' : len(qs), 'number of pages' : len(paginator.paginated_queryset), 'data' : MangaSerializer(qs, many = True).data})
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