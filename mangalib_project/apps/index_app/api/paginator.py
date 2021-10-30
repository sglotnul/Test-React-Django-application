class Paginator():
	OBJECTS_ON_PAGE = 8
	paginated_queryset = []

	def __init__(self, queryset):
		self.queryset = queryset
		self.paginate()

	def paginate(self):
		page = []
		for obj_index in range(len(self.queryset)):
			page.append(self.queryset[obj_index])
			if (len(page) >= self.OBJECTS_ON_PAGE) or (obj_index == len(self.queryset) - 1):
				self.paginated_queryset = [*self.paginated_queryset, page]
				page = []

	def get_page(self, page = 1):
		if len(self.paginated_queryset) == 0:
			return []
		return self.paginated_queryset[min(page, len(self.paginated_queryset)) - 1]