from django.db import models


class Page(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.title



class Service(models.Model):
    title = models.CharField(max_length=120)
    title_fa = models.CharField(max_length=120, blank=True, default="")
    text = models.TextField(blank=True, default="")
    text_fa = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=8, blank=True, default="")
    gallery = models.TextField(default="[]")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title
