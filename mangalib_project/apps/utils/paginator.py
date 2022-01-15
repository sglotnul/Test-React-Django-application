import math

class Paginator():
	OBJECTS_ON_PAGE = 1

	def __init__(self, queryset):
		self.queryset = queryset
		self.number_of_pages = self.get_number_of_pages()

	def __iter__(self):
		return (page for page in self.paginated_queryset)

	def get_number_of_pages(self):
		return math.ceil(len(self.queryset) / self.OBJECTS_ON_PAGE)

	def get_paginated_queryset(self):
		paginated_queryset = []
		page = []
		for obj_index in range(len(self.queryset)):
			page.append(self.queryset[obj_index])
			if (len(page) >= self.OBJECTS_ON_PAGE) or (obj_index == len(self.queryset) - 1):
				paginated_queryset = [*paginated_queryset, page]
				page = []
		return paginated_queryset

	def get_page(self, page):
		lower_bound = (page - 1) * self.OBJECTS_ON_PAGE
		upper_bound = min(page * self.OBJECTS_ON_PAGE, len(self.queryset))
		return self.queryset[lower_bound:upper_bound]