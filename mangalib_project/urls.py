from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('index_app.urls')),
    path('api/manga/', include('index_app.api.urls.manga_api_urls')),
    path('api/categories/', include('index_app.api.urls.categories_api_urls')),
    path('api/user/', include('user_app.api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root = settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)