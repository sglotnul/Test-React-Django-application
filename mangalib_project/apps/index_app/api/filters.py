from django.db.models import Q
from .paginator import Paginator

class FilterParameter():
	def __init__(self, template = '{}'):
		self.template = template
	def __set__(self, instance, value):
		instance.__dict__[self.name] = value.split(',')
		instance.__filters__ = [*instance.__filters__, self.name]
	def __get__(self, instance, owner):
		return instance.__dict__.get(self.name, None)
	def __set_name__(self, owner, name):
		self.name = self.template.format(name)

class Filter():
	__filters__ = []
	def __init__(self, fields_list):
		for field in fields_list:
			value = fields_list.get(field, None)
			if value:
				setattr(self, field, value)

	def __iter__(self):
		filter_list = ()
		for i in self.__filters__:
			f = getattr(self, i)
			filter_list = (*filter_list,  *(Q(**{i : e}) for e in f))
		return (x for x in filter_list)		

class MangaFilter(Filter):
	title = FilterParameter('{}__contains')
	description = FilterParameter('{}__contains')
	written_at = FilterParameter()
	created_at = FilterParameter()
	redacted_at = FilterParameter()

	def filter_by_categories(self, queryset):
		qs = queryset
		if not hasattr(self, 'categories'):
			return qs
		for cat in self.categories:
			qs = qs.filter(categories__id = cat)
		return qs

	def order(self, queryset):
		qs = queryset
		order = getattr(self, 'order_by', 'title')
		if not(order in dir(self.__class__)) or ('__' in order):
			order = 'title'
		return qs.order_by(order)

	def get_page(self, queryset):
		pages = Paginator(queryset)
		if not hasattr(self, 'page'):
			return pages.get_page()
		return pages.get_page(int(self.page))
