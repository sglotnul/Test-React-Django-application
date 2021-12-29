import os, uuid, shutil
from functools import reduce
from django.db import models
from django.db.models import Q
from django.conf import settings
from django.core.exceptions import PermissionDenied, FieldError
from user_app.models import CustomUser

def distance(a, b):
    "Calculates the Levenshtein distance between a and b."
    n, m = len(a), len(b)
    if n > m:
        # Make sure n <= m, to use O(min(n, m)) space
        a, b = b, a
        n, m = m, n

    current_row = range(n + 1)  # Keep current and previous row, not entire matrix
    for i in range(1, m + 1):
        previous_row, current_row = current_row, [i] + [0] * n
        for j in range(1, n + 1):
            add, delete, change = previous_row[j] + 1, current_row[j - 1] + 1, previous_row[j - 1]
            if a[j - 1] != b[i - 1]:
                change += 1
            current_row[j] = min(add, delete, change)

    return current_row[n]

def images_directory_path(instance, filename):
	return os.path.join("previews", str(instance.slug), str(uuid.uuid4().hex + ".jpg"))

class DefaultQuerySet(models.QuerySet):
	def delete(self, *args, **kwargs):
		if len(self) >= 5:
			raise PermissionDenied('you can\'t delete more then 5 objects')
		for obj in self:
			obj.delete()
		super(DefaultQuerySet, self).delete(*args, **kwargs)
	def safe_order_by(self, *args, **kwargs):
		qs = super(DefaultQuerySet, self)
		try:
			qs = qs.order_by(*args, **kwargs)
		except FieldError:
			qs = qs.order_by('title')
		return qs
	def include_or_exclude_filter(self, field, filters_list):
		qs = super(DefaultQuerySet, self)
		for f in filters_list:
			if f.startswith('-'):
				qs = qs.exclude(**{field: f[1:]})
			else:
				qs = qs.filter(**{field: f})
		return qs

class DefaultManager(models.Manager):
	def get_queryset(self):
		return DefaultQuerySet(self.model, using = self._db)
	def safe_get(self, **kwargs):
		result = None
		try:
			result = self.get(**kwargs)
		except:
			pass
		return result;
	def search(self, *strings, fields=None):
		fields_to_search = fields
		if fields_to_search is None:
			fields_to_search = ['title__contains',]
		filter_arg = Q()
		for string in strings:
			filter_arg = filter_arg | reduce(lambda prev_f, f: prev_f | Q(**{f: string}), fields_to_search, Q())
		qs = self.get_queryset().filter(filter_arg)
		return qs

class Category(models.Model):
	title = models.CharField(max_length = 200)
	is_critical = models.BooleanField(default = False)
	objects = DefaultManager()
	def __str__(self):
		return self.title
	class Meta:
		verbose_name = 'Категория'
		verbose_name_plural = 'Категории'
		ordering = ['title']

class Manga(models.Model):
	slug = models.SlugField(max_length = 200, verbose_name = 'Слаг', unique = True)
	title = models.CharField(max_length = 200, verbose_name = 'Название')
	description = models.TextField(blank = True, null = True, verbose_name = 'Описание')
	preview = models.ImageField(upload_to = images_directory_path, verbose_name = 'Превью', blank = True, null = True)
	views = models.IntegerField(verbose_name = 'Просмотров', default = 0)
	categories = models.ManyToManyField(Category, blank = True, verbose_name = 'Категории')
	written_at = models.DateField(verbose_name = 'Манга выпущена')
	created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
	redacted_at = models.DateTimeField(auto_now=True, verbose_name='Изменено')
	objects = DefaultManager()	

	def save(self, *args, **kwargs):
		if self.pk is None:
			root = os.path.join(settings.CHAPTERS_ROOT, self.slug)
			if os.path.isdir(root):
				shutil.rmtree(root)  
			os.mkdir(root)
			super(Manga, self).save(*args, **kwargs)
		elif self.__class__.objects.get(pk = self.pk).slug == self.slug:
			super(Manga, self).save(*args, **kwargs)
		
	def delete(self, *args, **kwargs):
		roots = [
			os.path.join(settings.CHAPTERS_ROOT, self.slug),
			os.path.join(settings.PREVIEWS_ROOT, self.slug)
		]
		for root in roots:
			if os.path.isdir(root):
				shutil.rmtree(root)  
		super(Manga, self).delete(*args, **kwargs)

	def __str__(self):
		return self.title

	class Meta:
		verbose_name = 'Манга'
		verbose_name_plural = 'Манга'
		ordering = ['-created_at']

class MangaChapter(models.Model):
	manga = models.ForeignKey(Manga, on_delete=models.CASCADE)
	number = models.IntegerField(blank=True)
	title = models.CharField(max_length=200)
	created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
	redacted_at = models.DateTimeField(auto_now=True, verbose_name='Изменено')
	objects = DefaultManager()

	def save(self, *args, **kwargs):
		if self.pk is None:
			self.number = len(self.__class__.objects.filter(manga=self.manga)) + 1
			PAGES_ROOT = os.path.join(settings.CHAPTERS_ROOT, self.manga.slug, str(self.number))
			if os.path.isdir(PAGES_ROOT):
				shutil.rmtree(PAGES_ROOT)  
			os.mkdir(PAGES_ROOT)
			super(MangaChapter, self).save(*args, **kwargs)
		elif self.__class__.objects.get(pk = self.pk).number == self.number:
			super(MangaChapter, self).save(*args, **kwargs)

	def delete(self, *args, **kwargs):
		PAGES_ROOT = os.path.join(settings.CHAPTERS_ROOT, self.manga.slug, str(self.number))
		if os.path.isdir(PAGES_ROOT):
			shutil.rmtree(PAGES_ROOT)  
		super(MangaChapter, self).delete(*args, **kwargs)

	def __str__(self):
		return '{} глава {} - {}'.format(self.manga, self.number, self.title)

	class Meta:
		verbose_name = 'Глава'
		verbose_name_plural = 'Главы'
		ordering = ['number']

class IntegerRangedField(models.IntegerField):
	def __init__(self, min_value=None, max_value=None, verbose_name=None, **kwargs):
		self.min_value, self.max_value = min_value, max_value
		models.IntegerField.__init__(self, verbose_name, **kwargs)
	def formfield(self, **kwargs):
		defaults = {'min_value': self.min_value, 'max_value': self.max_value}
		defaults.update(kwargs)
		return super(IntegerRangedField, self).formfield(**defaults)

class Comment(models.Model):
	author = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
	chapter = models.ForeignKey(MangaChapter, on_delete=models.CASCADE)
	created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
	redacted_at = models.DateTimeField(auto_now=True, verbose_name='Изменено')
	text= models.TextField(blank=True, verbose_name='Содержание')
	grade = IntegerRangedField(min_value=1, max_value=10, verbose_name='Оценка')

	def __str__(self):
		return str(self.pk)

	class Meta:
		verbose_name = 'Коментарий'
		verbose_name_plural = 'Коментарии'