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

	def filter(self, model, queryset = None):
		will_repeat = False
		qs = queryset or model.objects.all()
		for i in self.__filters__:
			params = getattr(self, i)
			if len(params) > 0:
				will_repeat = bool(len(params) > 1)
				param = params[0]
				try:
					if param.startswith('-'):
						qs = qs.exclude(**{i: param[1:]})
					else:
						qs = qs.filter(**{i: param})
				except:
					pass
				self.__dict__[i] = params[1:]
		if will_repeat:
			return self.filter(model, qs)
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
