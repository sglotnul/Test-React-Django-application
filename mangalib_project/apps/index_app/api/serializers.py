import os
from rest_framework import serializers
from django.conf import settings
from ..models import  *

class MangaSerializer(serializers.ModelSerializer):
	number_of_chapters = serializers.SerializerMethodField()
	categories = serializers.SerializerMethodField()
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
	@staticmethod
	def get_number_of_chapters(obj):
		return len(obj.mangachapter_set.all())
	@staticmethod
	def get_categories(obj):
		return CategorySerializer(obj.categories, many=True).data
	class Meta:
		model = Manga
		fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
	class Meta:
		model = Category
		fields = ['id', 'title', 'is_critical']

class MangaChapterSerializer(serializers.ModelSerializer):
	number_of_pages = serializers.SerializerMethodField()
	@staticmethod
	def get_number_of_pages(obj):
		root = os.path.join(settings.CHAPTERS_ROOT, obj.manga.slug, str(obj.number))
		dir_list = os.listdir(root)
		return len(list(filter(lambda f: os.path.isfile(os.path.join(root, f)), dir_list)))
	class Meta:
		model = MangaChapter
		fields = '__all__'