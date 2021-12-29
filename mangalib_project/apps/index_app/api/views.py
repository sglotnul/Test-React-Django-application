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
			qs = filters.filter()
			paginator = Paginator(qs)
			qs = filters.get_page(paginator)
			return JsonResponse({'result' : True, 'number_of_coincidences' : len(qs), 'number_of_pages' : len(paginator.paginated_queryset), 'data' : MangaSerializer(qs, many = True).data})
		object = Manga.objects.safe_get(pk=pk)
		if object:
			return JsonResponse({'result' : True, 'data' : MangaSerializer(object).data})
		return JsonResponse({'result' : False})

class categoriesAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			qs = Category.objects.all()
			return JsonResponse({'result' : True, 'number_of_coincidences' : len(qs), 'data' : CategorySerializer(qs, many = True).data})
		object = Category.objects.safe_get(pk=pk)
		if object:
			return JsonResponse({'result' : True, 'data' : CategorySerializer(object).data})
		return JsonResponse({'result' : False})

class chaptersAPI(View):
	def get(self, request, pk, number):
		manga = Manga.objects.safe_get(pk=pk)
		if not manga:
			return JsonResponse({'result' : False})
		object = manga.mangachapter_set.safe_get(number=number)
		if object and manga:
			return JsonResponse({'result' : True, 'data' : MangaChapterSerializer(object).data})
		return JsonResponse({'result' : False})