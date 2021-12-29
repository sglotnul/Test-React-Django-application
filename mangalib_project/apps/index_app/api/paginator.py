import math

class Paginator():
	OBJECTS_ON_PAGE = 1

	def __init__(self, queryset):
		self.queryset = queryset
		self.number_of_pages = self.get_number_of_pages()

	def __iter__(self):
		return (page for page in self.paginated_queryset)

	def get_number_of_pages(self, qs = None, objects_on_page = None):
		queryset = qs or self.queryset
		split_by = objects_on_page or self.OBJECTS_ON_PAGE
		return math.ceil(len(queryset) / split_by)

	def get_paginated_queryset(self, queryset = None, objects_on_page = None):
		queryset = qs or self.queryset
		split_by = objects_on_page or self.OBJECTS_ON_PAGE
		paginated_queryset = []
		page = []
		for obj_index in range(len(queryset)):
			page.append(queryset[obj_index])
			if (len(page) >= split_by) or (obj_index == len(queryset) - 1):
				paginated_queryset = [*paginated_queryset, page]
				page = []
		return paginated_queryset

	def get_page(self, page, qs = None, objects_on_page = None):
		queryset = qs or self.queryset
		split_by = objects_on_page or self.OBJECTS_ON_PAGE
		lower_bound = (page - 1) * split_by
		upper_bound = min(page * split_by, len(queryset))
		return queryset[lower_bound:upper_bound]