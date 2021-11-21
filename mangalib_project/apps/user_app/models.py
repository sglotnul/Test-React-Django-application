import os, uuid, shutil
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.conf import settings

def profile_images_directory_path(instance, filename):
    return os.path.join("profile_images", str(instance.username), str(uuid.uuid4().hex + ".jpg"))

class CustomUser(AbstractUser):
	profile_image = models.ImageField(upload_to = profile_images_directory_path, verbose_name = 'Изображение профиля', blank = True, null = True)
	def save(self, *args, **kwargs):
		IMAGE_ROOT = os.path.join(settings.MEDIA_ROOT, 'profile_images')
		if not(self.pk is None):
			username = self.__class__.objects.get(pk = self.pk).username
			if username != self.username:
				os.rename(os.path.join(IMAGE_ROOT, username), os.path.join(IMAGE_ROOT, self.username))
		super(CustomUser, self).save(*args, **kwargs)
	def delete(self, *args, **kwargs):
		root = os.path.join(settings.MEDIA_ROOT, 'profile_images',self.username)
		if os.path.isdir(root):
			shutil.rmtree(root)  
		super(CustomUser, self).delete(*args, **kwargs)

	def __str__(self):
		return self.username

	class Meta:
		verbose_name = 'Пользователь'
		verbose_name_plural = 'Пользователи'
		ordering = ['username']
