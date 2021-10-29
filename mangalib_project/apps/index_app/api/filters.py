from collections.abc import Mapping
from django.db.models import Q

class Descriptor():
	def __init__(self, template = '{}'):
		self.template = template
	def __set__(self, instance, value):
		instance.__dict__[self.name] = value.split(',')
		instance.__filters__ = [*instance.__filters__, self.name]
	def __get__(self, instance, owner):
		return instance.__dict__[self.name]
	def __set_name__(self, owner, name):
		self.name = self.template.format(name)

class Filter():
	__filters__ = []
	title = Descriptor('{}__contains')
	description = Descriptor('{}__contains')
	written_at = Descriptor()
	created_at = Descriptor()
	redacted_at = Descriptor()
	def __filter__(self, request, fields):
		for field in fields:
			value = request.GET.get(field, None)
			if value:
				setattr(self, field, value)
	def __iter__(self):
		filter_list = ()
		for i in self.__filters__:
			f = getattr(self, i)
			filter_list = (*filter_list,  *(Q(**{i : e}) for e in f))
		return (x for x in filter_list)		

def get_ordering(request, fields):
	order = request.GET.get('order_by', 'title')
	if order not in fields:
		order = 'title'
	return order

def get_filtered_by_category_queryset(request, queryset):
	qs = queryset
	if 'categories' in request.GET.keys():
		for cat in request.GET.get('categories').split(','):
			qs = qs.filter(categories__id = cat or 0)
	return qs