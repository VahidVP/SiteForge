from django.conf import settings
from django.core import signing
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Page, Service
from .serializers import PageSerializer, ServiceSerializer
from .owner import issue_owner_token


class PageDetailView(RetrieveAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = "slug"



class ServiceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(ServiceSerializer(Service.objects.all(), many=True).data)


class ServiceDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            service = Service.objects.get(pk=pk)
        except Service.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        return Response(ServiceSerializer(service).data)


class OwnerLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = str(request.data.get("code") or "").strip()
        expected = getattr(settings, "ADMIN_ACCESS_CODE", "")
        if not expected:
            return Response({"detail": "Owner access is not configured for this site."}, status=403)
        if code != expected:
            return Response({"detail": "Wrong code."}, status=400)
        return Response({"token": issue_owner_token()})
