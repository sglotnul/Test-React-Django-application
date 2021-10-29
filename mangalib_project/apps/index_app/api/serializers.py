import os

from rest_framework import serializers
from ..models import  *

class MangaSerializer(serializers.ModelSerializer):
	count_of_pages = serializers.SerializerMethodField()
	categories = serializers.SerializerMethodField()
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
	@staticmethod
	def get_count_of_pages(obj):
		path = os.path.join(settings.MEDIA_ROOT, 'pages', obj.slug)
		if not os.path.isdir(path):
			os.mkdir(path)
		if not os.path.isdir(path):
			return 'directory is not defined'
		return sum(os.path.isfile(os.path.join(path, file)) for file in os.listdir(path))
	@staticmethod
	def get_categories(obj):
		return CategorySerializer(obj.categories, many=True).data
	class Meta:
		model = Manga
		fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
	class Meta:
		model = Category
		fields = ['title', 'is_critical']

