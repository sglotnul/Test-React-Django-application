from django.db.models import Q
from ..models import *

class FilterParameter():
	def __init__(self, template = '{}'):
		self.template = template
	def __set__(self, instance, value):
		instance.templated_filters[self.name] = value.split(',')
	def __get__(self, instance, owner):
		return instance.templated_filters[self.name]
	def __set_name__(self, owner, name):
		self.name = self.template.format(name)

class Filter():
	def __init__(self, fields_list):
		self.templated_filters = {}
		for field in fields_list:
			value = fields_list.get(field)
			if value:
				setattr(self, field, value)

	def filter(self, queryset=None):
		model = getattr(self, 'model')
		if model is None:
			raise Exception('Модель не указана')
		qs = queryset
		if qs is None: 
			qs = model.objects.all()
		for param, value in self.templated_filters.items():
			qs = qs.include_or_exclude_filter(param, value)
		return qs

class MangaFilter(Filter):
	model = Manga
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

	def filter(self):
		search_params = getattr(self, 'search', '').split(' ')
		qs = super().filter(self.model.objects.search(*search_params, fields=self.fields_to_search))
		qs = qs.safe_order_by(getattr(self, 'order_by', 'title'))
		return qs

	def get_page(self, qs, paginator):
		if not hasattr(self, 'page'):
			return qs
		return paginator.get_page(int(self.page))
