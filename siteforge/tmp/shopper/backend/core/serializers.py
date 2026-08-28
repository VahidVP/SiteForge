import json

from rest_framework import serializers

from .models import Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ["slug", "title", "content"]


def _json_list(raw, default=None):
    if default is None:
        default = []
    try:
        val = json.loads(raw) if raw else default
        if isinstance(val, list):
            return val
        return default
    except Exception:
        return default


