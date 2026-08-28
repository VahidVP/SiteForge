from django.db import models


class Page(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.title


class Project(models.Model):
    name = models.CharField(max_length=120)
    name_fa = models.CharField(max_length=120, blank=True, default="")
    summary = models.CharField(max_length=240, blank=True, default="")
    summary_fa = models.CharField(max_length=240, blank=True, default="")
    description = models.TextField(blank=True, default="")
    description_fa = models.TextField(blank=True, default="")
    tags = models.TextField(default="[]")
    gallery = models.TextField(default="[]")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name

