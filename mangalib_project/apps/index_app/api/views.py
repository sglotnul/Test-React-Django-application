from django.views import View
from django.http import JsonResponse
from ..models import *
from .serializers import *
from utils.paginator import Paginator
from utils.filters import Filter, FilterParameter

class MangaFilter(Filter):
	fields_to_search = [
		'title__contains',
		'description__contains',
	]
	title = FilterParameter('{}__contains')
	description = FilterParameter('{}__contains')
	written_at = FilterParameter()
	created_at = FilterParameter()
	redacted_at = FilterParameter()
	categories = FilterParameter('{}__id')

	def search_in_qs(self, qs):
		search_params = getattr(self, 'search', '').split(' ')
		return qs.search(*search_params, by_fields=self.fields_to_search)

	def filter(self, *args, **kwargs):
		qs = super().filter(*args, **kwargs)
		qs = self.search_in_qs(qs)
		qs = qs.safe_order_by(getattr(self, 'order_by', 'title'))
		return qs

	def get_page(self, qs, paginator):
		if not hasattr(self, 'page'):
			return qs
		if not self.page.isdigit():
			return qs
		return paginator.get_page(int(self.page))

class mangaAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			qs = Manga.objects.all()
			filters = MangaFilter(request.GET)	
			qs = filters.filter(qs)
			paginator = Paginator(qs)
			qs = filters.get_page(qs, paginator)
			return JsonResponse({'result' : True, 'number_of_coincidences' : len(qs), 'number_of_pages' : paginator.number_of_pages, 'data' : MangaSerializer(qs, many = True).data})
		manga_object = Manga.objects.safe_get(pk=pk)
		if manga_object:
			return JsonResponse({'result' : True, 'data' : MangaSerializer(manga_object).data})
		return JsonResponse({'result' : False})

class categoriesAPI(View):
	def get(self, request, pk = None):
		if pk is None:
			qs = Category.objects.all()
			return JsonResponse({'result' : True, 'number_of_coincidences' : len(qs), 'data' : CategorySerializer(qs, many = True).data})
		category_object = Category.objects.safe_get(pk=pk)
		if category_object:
			return JsonResponse({'result' : True, 'data' : CategorySerializer(category_object).data})
		return JsonResponse({'result' : False})

class chaptersAPI(View):
	def get(self, request, pk, number):
		manga = Manga.objects.safe_get(pk=pk)
		if not manga:
			return JsonResponse({'result' : False})
		chapter_object = manga.mangachapter_set.safe_get(number=number)
		if chapter_object:
			return JsonResponse({'result' : True, 'data' : MangaChapterSerializer(chapter_object).data})
		return JsonResponse({'result' : False})