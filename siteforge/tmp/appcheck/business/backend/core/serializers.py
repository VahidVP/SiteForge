import json

from rest_framework import serializers

from .models import Page, Service


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



class ServiceSerializer(serializers.ModelSerializer):
    titleFa = serializers.CharField(source="title_fa", required=False, allow_blank=True)
    text = serializers.CharField(required=False, allow_blank=True, default="")
    textFa = serializers.CharField(source="text_fa", required=False, allow_blank=True)
    gallery = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ["id", "title", "titleFa", "text", "textFa", "icon", "gallery", "order", "createdAt"]
        extra_kwargs = {"title": {"required": True}, "icon": {"required": False, "allow_blank": True}, "order": {"required": False}}

    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    def get_gallery(self, obj):
        return _json_list(obj.gallery)

    def create(self, validated_data):
        gallery = self.initial_data.get("gallery")
        if gallery is not None and isinstance(gallery, list):
            validated_data["gallery"] = json.dumps([str(x) for x in gallery if x], ensure_ascii=False)
        for source, target in (("titleFa", "title_fa"), ("textFa", "text_fa")):
            if target not in validated_data and source in self.initial_data:
                validated_data[target] = str(self.initial_data.get(source) or "").strip()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        gallery = self.initial_data.get("gallery")
        if gallery is not None and isinstance(gallery, list):
            validated_data["gallery"] = json.dumps([str(x) for x in gallery if x], ensure_ascii=False)
        for source, target in (("titleFa", "title_fa"), ("textFa", "text_fa")):
            if target not in validated_data and source in self.initial_data:
                validated_data[target] = str(self.initial_data.get(source) or "").strip()
        return super().update(instance, validated_data)
