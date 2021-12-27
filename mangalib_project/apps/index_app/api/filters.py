from django.db.models import Q
from ..models import *

class FilterParameter():
	def __init__(self, template = '{}'):
		self.template = template
	def __set__(self, instance, value):
		setattr(instance.cleaned_data, self.name, value.split(','))
	def __get__(self, instance, owner):
		getattr(instance.cleaned_data, self.name)
	def __set_name__(self, owner, name):
		self.name = self.template.format(name)

#it could be a simple dict inside a Filter class, but i am practicing in oop, so this an object
class CleanedData():
	def __setattr__(self, name, value):
		self.__dict__[str(name)] = value
	def __iter__(self):
		for f in dir(self):
			if not f.startswith('__'):
				yield [f, getattr(self, f)]

class Filter():
	def __init__(self, fields_list):
		self.cleaned_data = CleanedData()
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
		for param, value in self.cleaned_data:
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

	def get_page(self, paginator):
		if not hasattr(self, 'page'):
			return paginator.queryset
		return paginator.get_page(int(self.page))
