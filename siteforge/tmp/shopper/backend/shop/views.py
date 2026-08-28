import json
import secrets
import uuid
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.owner import IsOwnerOrStaff

from .models import Order, PaymentSetting, Product, Ticket, TicketMessage, zarinpal_request, zarinpal_verify
from .serializers import ProductSerializer, normalize_details

FRONTEND = "http://localhost:5173"

try:
    from PIL import Image as PilImage

    HAS_PIL = True
except ImportError:
    PilImage = None
    HAS_PIL = False


class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        lang = request.query_params.get("lang", "en")
        data = []
        for p in Product.objects.all():
            item = ProductSerializer(p).data
            if lang == "fa":
                item["name"] = p.name_fa or p.name
                item["description"] = p.description_fa or p.description
            data.append(item)
        return Response(data)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            p = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        data = ProductSerializer(p).data
        lang = request.query_params.get("lang", "en")
        if lang == "fa":
            data["name"] = p.name_fa or p.name
            data["description"] = p.description_fa or p.description
        return Response(data)


class AdminProductUpdateView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def put(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        data = request.data

        def get_field(*keys):
            for k in keys:
                if k in data:
                    return data[k]
            return None

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


def order_json(order):
    return {
        "code": order.code,
        "status": order.status,
        "totalAmount": str(order.total_amount),
        "refId": order.ref_id or None,
        "itemsSnapshot": order.items_snapshot,
        "createdAt": order.created_at.isoformat(),
    }


class PaymentStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        setting = PaymentSetting.load()
        return Response({"enabled": setting.enabled and bool(setting.merchant_id), "sandbox": setting.sandbox})


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get("items") or []

        products = list(Product.objects.filter(id__in=ids))
        if not products:
            return Response({"detail": "Cart is empty or invalid."}, status=400)
        total = sum(p.price for p in products)
        items_snapshot = json.dumps(
            [{"id": p.id, "name": p.name, "price": str(p.price)} for p in products]
        )
        code = "ORD-" + secrets.token_hex(4).upper()
        order = Order.objects.create(
            user=request.user,
            code=code,
            total_amount=total,
            items_snapshot=items_snapshot,
        )
        setting = PaymentSetting.load()
        if not (setting.enabled and setting.merchant_id):
            url = "/api/payment/mock?" + urlencode({"order": code})
            return Response({"mode": "mock", "url": url})
        try:
            authority = zarinpal_request(
                setting,
                total,
                request.build_absolute_uri(f"/api/payment/callback?order={code}"),
                f"Order {code}",
            )
        except Exception as exc:
            order.status = "failed"
            order.save(update_fields=["status"])
            return Response({"detail": f"Gateway error: {exc}"}, status=502)
        order.authority = authority
        order.save(update_fields=["authority"])
        return Response({"mode": "zarinpal", "url": f"{setting.base_url()}/pg/StartPay/{authority}"})


class MockGatewayView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("order", "")
        html = f"""<!doctype html><html><head><meta charset='utf-8'><title>Mock Gateway</title>
<style>body{{font-family:sans-serif;display:grid;place-items:center;height:100vh;background:#10131a;color:#fff}}
a{{display:block;margin:8px;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:bold}}
.ok{{background:#10b981;color:#04281a}}.no{{background:#f87171;color:#2b0505}}</style></head>
<body><div style='text-align:center'><h2>Sandbox Mock Gateway</h2><p>Order {code}</p>
<a class='ok' href='/api/payment/callback?order={code}&Status=OK'>Simulate SUCCESS</a>
<a class='no' href='/api/payment/callback?order={code}&Status=NOK'>Simulate FAILURE</a>
</div></body></html>"""
        return HttpResponse(html)


class PaymentCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("order", "")
        status_param = request.query_params.get("Status", "")
        authority = request.query_params.get("Authority", "")
        try:
            order = Order.objects.get(code=code)
        except Order.DoesNotExist:
            return HttpResponseRedirect(f"{FRONTEND}/payment/result?order={code}")
        if order.status == "pending":
            if setting_enabled(order) and authority:
                ok, ref_id = zarinpal_verify(PaymentSetting.load(), order.total_amount, authority)
            else:
                ok, ref_id = (status_param == "OK"), ""
            if ok:
                order.status = "paid"
                order.ref_id = ref_id or secrets.token_hex(4).upper()
            elif status_param:
                order.status = "failed"
            order.save()
        query = urlencode({"order": code})
        return HttpResponseRedirect(f"{FRONTEND}/payment/result?{query}")


def setting_enabled(order):
    setting = PaymentSetting.load()
    return setting.enabled and bool(setting.merchant_id)


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user)
        return Response([order_json(o) for o in orders])


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        try:
            order = Order.objects.get(code=code)
        except Order.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if order.user != request.user and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        return Response(order_json(order))


class AdminOrdersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = []
        for o in Order.objects.all():
            item = order_json(o)
            item["userEmail"] = o.user.email
            data.append(item)
        return Response(data)


class AdminPaymentSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        setting = PaymentSetting.load()
        return Response({"enabled": setting.enabled, "sandbox": setting.sandbox, "merchantId": setting.merchant_id})

    def put(self, request):
        setting = PaymentSetting.load()
        setting.enabled = bool(request.data.get("enabled"))
        setting.sandbox = bool(request.data.get("sandbox"))
        merchant = str(request.data.get("merchantId") or "").strip()
        if merchant and not merchant.count("-") == 4:
            pass
        setting.merchant_id = merchant
        setting.save()
        return Response({"enabled": setting.enabled, "sandbox": setting.sandbox, "merchantId": setting.merchant_id})


def ticket_json(ticket, include_user=True):
    data = {"id": ticket.id, "subject": ticket.subject, "status": ticket.status,
            "createdAt": ticket.created_at.isoformat()}
    if include_user:
        data["userEmail"] = ticket.user.email
    return data


def message_json(message):
    return {"id": message.id, "sender": message.sender, "body": message.body,
            "createdAt": message.created_at.isoformat()}


class TicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = Ticket.objects.filter(user=request.user)
        return Response([ticket_json(tk, include_user=False) for tk in tickets])

    def post(self, request):
        subject = str(request.data.get("subject") or "").strip()
        body = str(request.data.get("body") or "").strip()
        if not subject or not body:
            return Response({"detail": "Subject and body are required."}, status=400)
        ticket = Ticket.objects.create(user=request.user, subject=subject[:200])
        TicketMessage.objects.create(ticket=ticket, sender="user", body=body)
        return Response(ticket_json(ticket), status=201)


class TicketThreadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if ticket.user != request.user and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        return Response([message_json(m) for m in ticket.messages.all()])


class TicketReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if ticket.user != request.user and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        body = str(request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "Body required."}, status=400)
        sender = "admin" if request.user.is_staff else "user"
        TicketMessage.objects.create(ticket=ticket, sender=sender, body=body)
        if sender == "admin":
            ticket.status = "answered"
        else:
            ticket.status = "open"
        ticket.save(update_fields=["status"])
        return Response([message_json(m) for m in ticket.messages.all()])


class AdminTicketListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response([ticket_json(tk) for tk in Ticket.objects.all()])


class AdminTicketReplyView(APIView):
    permission_classes = [IsAdminUser]

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
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        Ticket.objects.filter(pk=pk).update(status="closed")
        return Response(status=204)


class ProductImageUploadView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        files = request.FILES.getlist("images")
        if not files:
            single = request.FILES.get("image")
            if single:
                files = [single]
        if not files:
            return Response({"detail": "No images provided. Use field 'images'."}, status=400)
        if len(files) > 6:
            return Response({"detail": "Up to 6 images allowed per request."}, status=400)

        try:
            gallery = json.loads(product.gallery) if product.gallery else []
            if not isinstance(gallery, list):
                gallery = []
        except Exception:
            gallery = []

        if len(gallery) + len(files) > 6:
            return Response({"detail": f"Gallery limit is 6 images. Currently has {len(gallery)}."}, status=400)

        media_root = Path(settings.MEDIA_ROOT) / "products"
        media_root.mkdir(parents=True, exist_ok=True)

        new_paths = []
        for f in files:
            uid = uuid.uuid4().hex
            filename = f"{uid}.webp"
            dest = media_root / filename
            saved = False
            if HAS_PIL:
                try:
                    f.seek(0)
                    image = PilImage.open(f)
                    if image.mode in ("RGBA", "LA"):
                        bg = PilImage.new("RGB", image.size, (255, 255, 255))
                        bg.paste(image, mask=image.split()[-1])
                        image = bg
                    elif image.mode != "RGB":
                        image = image.convert("RGB")
                    image.save(dest, "WEBP", quality=80, method=4)
                    saved = True
                except Exception:
                    saved = False
            if not saved:
                try:
                    f.seek(0)
                except Exception:
                    pass
                with open(dest, "wb") as out:
                    for chunk in f.chunks():
                        out.write(chunk)
            rel = f"/media/products/{filename}"
            new_paths.append(rel)

        gallery.extend(new_paths)
        product.gallery = json.dumps(gallery)
        if gallery:
            product.image_url = gallery[0]
        product.save(update_fields=["gallery", "image_url"])
        return Response(ProductSerializer(product).data, status=201)

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        path_to_remove = request.data.get("path") or request.query_params.get("path")
        if not path_to_remove:
            return Response({"detail": "Provide 'path' to remove."}, status=400)
        try:
            gallery = json.loads(product.gallery) if product.gallery else []
            if not isinstance(gallery, list):
                gallery = []
        except Exception:
            gallery = []
        if path_to_remove not in gallery:
            return Response({"detail": "Image not in gallery."}, status=404)
        gallery = [p for p in gallery if p != path_to_remove]
        # try remove file
        try:
            rel = path_to_remove.lstrip("/")
            # rel should be media/products/<file>
            if rel.startswith("media/"):
                file_path = Path(settings.MEDIA_ROOT).parent / rel if str(settings.MEDIA_ROOT).endswith("media") else Path(settings.MEDIA_ROOT) / Path(rel).name
                # fallback resolution: MEDIA_ROOT/products/<name>
                candidate = Path(settings.MEDIA_ROOT) / Path(path_to_remove).name
                if candidate.exists():
                    candidate.unlink(missing_ok=True)
                else:
                    (Path(settings.MEDIA_ROOT) / "products" / Path(path_to_remove).name).unlink(missing_ok=True)
        except Exception:
            pass
        product.gallery = json.dumps(gallery)
        if gallery:
            product.image_url = gallery[0]
        elif product.image_url and product.image_url.startswith("/media/"):
            product.image_url = ""
        product.save(update_fields=["gallery", "image_url"])
        return Response(ProductSerializer(product).data)
