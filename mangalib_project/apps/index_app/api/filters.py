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

class CleanedData():
	def __init__(self):
		self.filters = []
	def __setattr__(self, name, value):
		if hasattr(self, 'filters'):
			self.filters.append(str(name))
		self.__dict__[str(name)] = value
	def __iter__(self):
		for f in self.filters:
			yield [f, getattr(self, f)]

class Filter():
	def __init__(self, fields_list):
		self.cleaned_data = CleanedData()
		for field in fields_list:
			value = fields_list.get(field)
			if value:
				setattr(self, field, value)

	def filter(self):
		model = getattr(self, 'model')
		fields_to_search = getattr(self, 'fields_to_search', [])
		if model is None:
			raise Exception('Модель не указана')
		qs = model.objects.search(fields_to_search, *getattr(self, 'search', '').split(','))
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

	def filter(self, *args, **kwargs):
		qs = super().filter(*args, **kwargs)
		qs = qs.safe_order_by(getattr(self, 'order_by', 'title'))
		return qs

	def get_page(self, paginator):
		if not hasattr(self, 'page'):
			return paginator.queryset
		return paginator.get_page(int(self.page))
