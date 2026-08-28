import json
import uuid
import urllib.request

from django.conf import settings
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=120)
    name_fa = models.CharField(max_length=120, blank=True, default="")
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=12, decimal_places=0)
    image_url = models.URLField(blank=True)
    gallery = models.TextField(default="[]")
    details = models.TextField(default="{}")
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-featured", "name"]

    def __str__(self):
        return self.name


class PaymentSetting(models.Model):
    enabled = models.BooleanField(default=False)
    sandbox = models.BooleanField(default=True)
    merchant_id = models.CharField(max_length=64, blank=True, default="")

    @classmethod
    def load(cls):
        return cls.objects.first() or cls.objects.create()

    def base_url(self):
        return "https://sandbox.zarinpal.com" if self.sandbox else "https://payment.zarinpal.com"


class Order(models.Model):
    STATUS = [("pending", "pending"), ("paid", "paid"), ("failed", "failed"), ("canceled", "canceled")]

    code = models.CharField(max_length=24, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    total_amount = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(max_length=12, choices=STATUS, default="pending")
    authority = models.CharField(max_length=64, blank=True, default="")
    ref_id = models.CharField(max_length=64, blank=True, default="")
    items_snapshot = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Ticket(models.Model):
    STATUS = [("open", "open"), ("answered", "answered"), ("closed", "closed")]

    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=12, choices=STATUS, default="open")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=8, choices=[("user", "user"), ("admin", "admin")])
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


def zarinpal_request(payment_setting, amount, callback_url, description):
    payload = {
        "merchant_id": payment_setting.merchant_id,
        "amount": int(amount),
        "currency": "IRT",
        "description": description,
        "callback_url": callback_url,
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{payment_setting.base_url()}/pg/v4/payment/request.json",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        result = json.loads(response.read().decode())
    if result.get("data") and result["data"].get("authority"):
        return result["data"]["authority"]
    raise RuntimeError(json.dumps(result.get("errors") or {"detail": "gateway rejected request"}))


def zarinpal_verify(payment_setting, amount, authority):
    payload = {"merchant_id": payment_setting.merchant_id, "amount": int(amount), "authority": authority}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{payment_setting.base_url()}/pg/v4/payment/verify.json",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        result = json.loads(response.read().decode())
    inner = result.get("data") or {}
    code = inner.get("code")
    if code in (100, 101):
        return True, str(inner.get("ref_id", ""))
    return False, ""
