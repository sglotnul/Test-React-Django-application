import inspect

def field(func):
	def wrapper(*args, **kwargs):
		return func(*args, **kwargs)
	wrapper._is_field = True
	return wrapper

def required_field(func):
	@field
	def wrapper(*args, **kwargs):
		return func(*args, **kwargs)

	wrapper._required = True
	return wrapper

class ValidatorMetaclass(type):
	def __new__(cls, clsname, bases, dct):
		fields = filter(lambda dct_item: hasattr(dct_item[1], '_is_field'), dct.items())
		fields = map(lambda field_tuple: field_tuple[0], fields)
		required_fields = filter(lambda dct_item: hasattr(dct_item[1], '_required'), dct.items())
		required_fields = map(lambda require_field_tuple: require_field_tuple[0], required_fields)
		new_class = super(ValidatorMetaclass, cls).__new__(cls, clsname, bases, dct)
		new_class._fields = list(fields)
		new_class._required_fields = list(required_fields)
		return new_class

class Validator(metaclass=ValidatorMetaclass):
	def __init__(self, request):
		self.post_data = request.POST
		self.validated_data = {}

	def check_field_is_valid(self, field_name, value):
		validator_function = getattr(self, field_name, None)
		is_valid = validator_function(value)
		print(f'{field_name}: {is_valid}')
		if not is_valid:
			raise Exception(f'{field_name} is invalid')
		self.validated_data[field_name] = value

	def check_required_fields_are_filled(self):
		for field_name in self._required_fields:
			value = self.post_data.get(field_name, None)
			if not value:
				raise Exception(f'{field_name} is required')

	def validate(self):	
		self.check_required_fields_are_filled()

		for field_name in self.post_data:
			if field_name in self._fields:
				value = self.post_data.get(field_name)
				self.check_field_is_valid(field_name, value)

	def get_validated_data(self):
		self.validate()
		return self.validated_data