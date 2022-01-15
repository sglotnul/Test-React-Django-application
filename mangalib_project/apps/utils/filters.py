from django.db.models import Q

class Parameter():
	def __init__(self, name, value):
		self.templated_name = name
		self.value = value

class FilterParameter():
	def __init__(self, template = '{}'):
		self.template = template
	def __set__(self, instance, value):
		splited_value = value.split(',')
		instance.__dict__[self.name] = Parameter(self.template.format(self.name), splited_value)
	def __get__(self, instance, owner):
		return instance.__dict__.get(self.name, None)
	def __set_name__(self, owner, name):
		self.name = name

class Filter():
	def __init__(self, fields_list):
		for field, value in fields_list.items():
			if value:
				setattr(self, field, value)

	def filter(self, queryset):
		qs = queryset
		for param, value in self.get_filter_params():
			qs = qs.include_or_exclude_filter(param, value)
		return qs

	def get_filter_params(self):
		filter_list = filter(lambda attribute: isinstance(attribute, Parameter), self.__dict__.values())
		return map(lambda filter_param_object: (filter_param_object.templated_name, filter_param_object.value), filter_list)

