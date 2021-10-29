import os, uuid, shutil
from django.db import models
from django.conf import settings
from django.core.exceptions import PermissionDenied

def images_directory_path(instance, filename):
	return os.path.join("previews", str(instance.slug), str(uuid.uuid4().hex + ".jpg"))

class MangaQuerySet(models.QuerySet):
	def delete(self, *args, **kwargs):
		if len(self) >= 5:
			raise PermissionDenied('you can\'t delete more then 5 objects')
		for obj in self:
			obj.delete()
		super(MangaQuerySet, self).delete(*args, **kwargs)

class MangaManager(models.Manager):
	def get_queryset(self):
		return MangaQuerySet(self.model, using = self._db)
	def safe_get(self, pk):
		result = None
		try:
			result = self.get(pk = pk)
		except:
			pass
		return result;

class Category(models.Model):
	title = models.CharField(max_length = 200)
	is_critical = models.BooleanField(default = False)
	objects = MangaManager()
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
	objects = MangaManager()	

	def save(self, *args, **kwargs):
		PAGES_ROOT = os.path.join(settings.MEDIA_ROOT, 'pages')
		if self.pk is None:
			path = os.path.join(PAGES_ROOT, self.slug)
			if not os.path.isdir(path):
				os.mkdir(path)
			super(Manga, self).save(*args, **kwargs)
		elif self.__class__.objects.get(pk = self.pk).slug == self.slug:
			super(Manga, self).save(*args, **kwargs)
		

	def delete(self, *args, **kwargs):
		roots = [
			os.path.join(settings.MEDIA_ROOT, 'pages', self.slug),
			os.path.join(settings.MEDIA_ROOT, 'previews', self.slug)
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