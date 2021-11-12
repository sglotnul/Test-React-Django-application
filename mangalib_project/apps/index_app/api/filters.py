from django.db.models import Q

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

	def filter(self, model):
		qs = model.objects.all()
		for field in self.__filters__:
			params = getattr(self, field)
			qs = qs.include_or_exclude_filter(field, params)
		return qs

class MangaFilter(Filter):
	title = FilterParameter('{}__contains')
	description = FilterParameter('{}__contains')
	written_at = FilterParameter()
	created_at = FilterParameter()
	redacted_at = FilterParameter()
	categories = FilterParameter('{}__id')

	def filter(self, *args, **kwargs):
		qs = super().filter(*args, **kwargs)
		qs = self.order(qs)
		return qs

	def order(self, queryset):
		qs = queryset
		order = getattr(self, 'order_by', 'title')
		return qs.safe_order_by(order)

	def get_page(self, paginator):
		if not hasattr(self, 'page'):
			return paginator.queryset
		return paginator.get_page(int(self.page))
