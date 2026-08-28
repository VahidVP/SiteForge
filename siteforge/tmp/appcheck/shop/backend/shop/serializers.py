import json

from rest_framework import serializers

from .models import Product


def normalize_details(raw):
    """Normalize details (dict or list of rows) into list of {key,keyFa,value,valueFa} rows."""
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return []
    if isinstance(raw, dict):
        rows = [{"key": str(k), "value": str(v)} for k, v in raw.items()]
    elif isinstance(raw, list):
        rows = []
        for item in raw:
            if isinstance(item, dict):
                rows.append({
                    "key": str(item.get("key") or ""),
                    "keyFa": str(item.get("keyFa") or ""),
                    "value": str(item.get("value") or ""),
                    "valueFa": str(item.get("valueFa") or ""),
                })
    else:
        return []
    return [r for r in rows if r["key"] or r["keyFa"] or r["value"] or r["valueFa"]]


class ProductSerializer(serializers.ModelSerializer):
    gallery = serializers.SerializerMethodField()
    imageUrl = serializers.CharField(source="image_url", read_only=True)
    details = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "name_fa", "description", "description_fa", "price", "image_url", "imageUrl", "gallery", "details", "featured"]
        extra_kwargs = {
            "name_fa": {"required": False, "allow_blank": True},
            "description_fa": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "image_url": {"required": False, "allow_blank": True},
            "details": {"required": False, "allow_blank": True},
        }

    def get_gallery(self, obj):
        try:
            val = json.loads(obj.gallery) if obj.gallery else []
            if isinstance(val, list):
                return val
            return []
        except Exception:
            return []

    def get_details(self, obj):
        try:
            raw = getattr(obj, "details", "{}")
            if not raw:
                return []
            return normalize_details(raw)
        except Exception:
            return []

    def create(self, validated_data):
        details = self.initial_data.get("details")
        if details is None:
            details = self.initial_data.get("DetailsJson") or self.initial_data.get("detailsJson")
        if details not in (None, ""):
            validated_data["details"] = json.dumps(normalize_details(details), ensure_ascii=False)
        gallery = self.initial_data.get("gallery")
        if gallery is not None and isinstance(gallery, list):
            validated_data["gallery"] = json.dumps([str(x) for x in gallery if x], ensure_ascii=False)
        return super().create(self._map_camel_fields(validated_data))

    def update(self, instance, validated_data):
        details = self.initial_data.get("details")
        if details is None:
            details = self.initial_data.get("DetailsJson") or self.initial_data.get("detailsJson")
        if details not in (None, ""):
            instance.details = json.dumps(normalize_details(details), ensure_ascii=False)
        gallery = self.initial_data.get("gallery")
        if gallery is not None and isinstance(gallery, list):
            instance.gallery = json.dumps([str(x) for x in gallery if x], ensure_ascii=False)
        return super().update(instance, self._map_camel_fields(validated_data))

    def _map_camel_fields(self, validated_data):
        """Accept camelCase keys the admin frontend sends (nameFa, descriptionFa, imageUrl)."""
        for source, target in (
            ("nameFa", "name_fa"),
            ("descriptionFa", "description_fa"),
            ("imageUrl", "image_url"),
        ):
            if target not in validated_data and source in self.initial_data:
                validated_data[target] = str(self.initial_data.get(source) or "").strip()
        return validated_data
