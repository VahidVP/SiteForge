from pathlib import Path

from django.conf import settings
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView

from core.owner import IsOwnerOrStaff
from contact.models import ContactMessage
from contact.serializers import ContactMessageSerializer


class AdminMessagesView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        return Response(ContactMessageSerializer(ContactMessage.objects.all(), many=True).data)
from shop.models import Order, PaymentSetting, Product, Ticket, TicketMessage
from shop.serializers import ProductSerializer, normalize_details


class AdminProductsView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        return Response(ProductSerializer(Product.objects.order_by("id"), many=True).data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(ProductSerializer(product).data, status=201)


class AdminProductDeleteView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        return Response(ProductSerializer(product).data)

    def put(self, request, pk):
        import json
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        data = request.data
        if "name" in data:
            val = str(data.get("name") or "").strip()
            if val:
                product.name = val
        for k in ("name_fa", "nameFa"):
            if k in data:
                product.name_fa = str(data.get(k) or "").strip()
                break
        if "description" in data:
            product.description = str(data.get("description") or "")
        for k in ("description_fa", "descriptionFa"):
            if k in data:
                product.description_fa = str(data.get(k) or "")
                break
        if "price" in data:
            try:
                product.price = data.get("price")
            except Exception:
                pass
        for k in ("image_url", "imageUrl", "ImageUrl"):
            if k in data:
                product.image_url = str(data.get(k) or "").strip()
                break
        if "featured" in data:
            product.featured = bool(data.get("featured"))
        details_handled = False
        for key in ("details", "DetailsJson", "detailsJson"):
            if key in data and not details_handled:
                details_val = data.get(key)
                if details_val is not None and not (isinstance(details_val, str) and not details_val.strip()):
                    product.details = json.dumps(normalize_details(details_val), ensure_ascii=False)
                else:
                    product.details = "{}"
                details_handled = True
        product.save()
        return Response(ProductSerializer(product).data)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        deleted, _ = Product.objects.filter(pk=pk).delete()
        if not deleted:
            return Response({"detail": "Not found."}, status=404)
        return Response(status=204)


def order_json(order):
    return {"code": order.code, "status": order.status, "totalAmount": str(order.total_amount),
            "userEmail": order.user.email, "createdAt": order.created_at.isoformat()}


class AdminOrdersView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        return Response([order_json(o) for o in Order.objects.all()])


def ticket_json(ticket):
    return {"id": ticket.id, "subject": ticket.subject, "status": ticket.status,
            "userEmail": ticket.user.email, "createdAt": ticket.created_at.isoformat()}


def message_json(message):
    return {"id": message.id, "sender": message.sender, "body": message.body,
            "createdAt": message.created_at.isoformat()}


class AdminTicketsView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        return Response([ticket_json(tk) for tk in Ticket.objects.all()])


class AdminTicketThreadView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        return Response([message_json(m) for m in ticket.messages.all()])


class AdminTicketReplyView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def post(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        body = str(request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "Body required."}, status=400)
        TicketMessage.objects.create(ticket=ticket, sender="admin", body=body)
        ticket.status = "answered"
        ticket.save(update_fields=["status"])
        return Response(status=204)


class AdminTicketCloseView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def post(self, request, pk):
        Ticket.objects.filter(pk=pk).update(status="closed")
        return Response(status=204)


class AdminPaymentSettingsView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        setting = PaymentSetting.load()
        return Response({"enabled": setting.enabled, "sandbox": setting.sandbox, "merchantId": setting.merchant_id})

    def put(self, request):
        setting = PaymentSetting.load()
        setting.enabled = bool(request.data.get("enabled"))
        setting.sandbox = bool(request.data.get("sandbox"))
        setting.merchant_id = str(request.data.get("merchantId") or "").strip()
        setting.save()
        return Response({"enabled": setting.enabled, "sandbox": setting.sandbox, "merchantId": setting.merchant_id})

def _media_root():
    return settings.MEDIA_ROOT if settings.MEDIA_ROOT else Path(settings.BASE_DIR) / "media"


class AdminMediaView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        root = _media_root()
        files = []
        if root.exists():
            for path in sorted(root.rglob("*")):
                if path.is_file() and path.suffix.lower() in (".webp", ".webp.png", ".png", ".jpg", ".jpeg", ".svg", ".gif"):
                    rel = "/media/" + path.relative_to(root).as_posix()
                    files.append({"name": path.name, "url": rel})
        return Response(files)

    def post(self, request):
        images = request.FILES.getlist("images")
        if not images:
            return Response({"detail": "No images."}, status=400)
        root = _media_root()
        root.mkdir(parents=True, exist_ok=True)
        saved = []
        from django.core.files.storage import default_storage
        for image in images[:8]:
            name = default_storage.get_available_name(image.name)
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("wb") as dest:
                for chunk in image.chunks():
                    dest.write(chunk)
            saved.append({"url": "/media/" + name})
        return Response(saved)


urlpatterns = [
    path("media/", AdminMediaView.as_view()),
    path("messages/", AdminMessagesView.as_view()),
    path("products/", AdminProductsView.as_view()),
    path("products/<int:pk>/", AdminProductDeleteView.as_view()),
    path("orders/", AdminOrdersView.as_view()),
    path("tickets/", AdminTicketsView.as_view()),
    path("tickets/<int:pk>/", AdminTicketThreadView.as_view()),
    path("tickets/<int:pk>/reply/", AdminTicketReplyView.as_view()),
    path("tickets/<int:pk>/close/", AdminTicketCloseView.as_view()),
    path("settings/payment/", AdminPaymentSettingsView.as_view()),
]
