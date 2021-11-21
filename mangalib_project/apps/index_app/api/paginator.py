class Paginator():
	OBJECTS_ON_PAGE = 1
	paginated_queryset = []

	def __init__(self, queryset):
		self.queryset = queryset
		self.paginate(queryset)

	def __iter__(self):
		return (page for page in self.paginated_queryset)

	def paginate(self, queryset):
		page = []
		for obj_index in range(len(queryset)):
			page.append(queryset[obj_index])
			if (len(page) >= self.OBJECTS_ON_PAGE) or (obj_index == len(queryset) - 1):
				self.paginated_queryset = [*self.paginated_queryset, page]
				page = []

	def get_page(self, page):
		if not self.paginated_queryset:
			return []
		return self.paginated_queryset[min(page, len(self.paginated_queryset)) - 1]